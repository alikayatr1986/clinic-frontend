// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import ts from "typescript";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "..");
const frontendRoot = join(here, "../..");

interface ProceduresKeysShape {
  all: readonly string[];
}

interface ContactKeysShape {
  all: readonly string[];
  consent: (locale: string) => readonly (string | readonly string[])[];
}

interface BlogKeysShape {
  all: readonly string[];
  home: (locale: string) => readonly (string | readonly string[])[];
}

interface GalleryKeysShape {
  all: readonly string[];
  landing: (locale: string) => readonly (string | readonly string[])[];
  list: (locale: string, params?: Record<string, unknown>) => readonly unknown[];
}

/**
 * Dynamic loader helper that loads feature modules at test runtime without
 * creating a static AST dependency in this shared test file.
 */
async function loadFeatureModule<T = Record<string, unknown>>(modulePath: string): Promise<T> {
  return import(/* @vite-ignore */ modulePath);
}

let proceduresKeys: ProceduresKeysShape;
let contactKeys: ContactKeysShape;
let blogKeys: BlogKeysShape;
let galleryKeys: GalleryKeysShape;

/** Allowed file for general HTTP fetch calls. */
const ALLOWED_FETCH_FILES = new Set(["src/lib/api.ts"]);

/**
 * Recursively find all production source files in a directory,
 * excluding tests, stories, and fixtures.
 */
function getProductionSourceFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const normalized = fullPath.replace(/\\/g, "/");
    if (normalized.includes("/src/test/") || normalized.endsWith("/src/test")) {
      continue;
    }
    if (entry.isDirectory()) {
      results.push(...getProductionSourceFiles(fullPath));
    } else if (entry.isFile()) {
      const isSource = /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name);
      const isTestOrStory =
        entry.name.endsWith(".test.ts") ||
        entry.name.endsWith(".test.tsx") ||
        entry.name.endsWith(".test.js") ||
        entry.name.endsWith(".stories.tsx") ||
        entry.name.endsWith(".stories.ts") ||
        entry.name.includes(".fixtures.");

      if (isSource && !isTestOrStory) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

/**
 * Check whether a source string or file contains direct fetch() calls.
 */
export function findDirectFetchCalls(
  sourceText: string,
  fileName = "probe.tsx",
): { line: number; text: string }[] {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
  );

  const violations: { line: number; text: string }[] = [];

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      let isFetchCall = false;

      // direct fetch(...)
      if (ts.isIdentifier(node.expression) && node.expression.text === "fetch") {
        isFetchCall = true;
      }

      // window.fetch(...), global.fetch(...), globalThis.fetch(...)
      if (ts.isPropertyAccessExpression(node.expression)) {
        const propName = node.expression.name.text;
        const targetExpr = node.expression.expression;
        if (
          propName === "fetch" &&
          ts.isIdentifier(targetExpr) &&
          ["window", "global", "globalThis"].includes(targetExpr.text)
        ) {
          isFetchCall = true;
        }
      }

      if (isFetchCall) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(
          node.getStart(sourceFile),
        );
        violations.push({
          line: line + 1,
          text: node.getText(sourceFile).slice(0, 50),
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

/**
 * Check whether a source file has `"use client"` directive.
 */
export function isClientComponent(sourceText: string): boolean {
  return /^\s*(['"])use client\1/m.test(sourceText);
}

/**
 * Check whether a file is a presentation component (in components/ or app/)
 * as opposed to a hook or library module.
 */
export function isPresentationComponentFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  if (!normalized.includes("/")) {
    return true;
  }
  const isUnderComponentsOrApp =
    normalized.includes("/components/") || normalized.includes("/app/");
  const isHookFile =
    normalized.includes("/hooks/") || /[\\/]use[A-Z]\w*\.tsx?$/.test(normalized);

  return isUnderComponentsOrApp && !isHookFile;
}

/**
 * Check whether a client component source file imports data-fetching/mutation functions from a service.
 */
export function findClientServiceImportViolations(
  sourceText: string,
  fileName = "probe.tsx",
): string[] {
  if (!isClientComponent(sourceText) || !isPresentationComponentFile(fileName)) {
    return [];
  }

  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
  );

  const violations: string[] = [];

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const moduleSpecifier = statement.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const importPath = moduleSpecifier.text;
        const isServiceImport =
          /\.service(\.ts)?$/.test(importPath) ||
          importPath.includes("/services/");
        const isDirectTransportImport =
          importPath === "@/lib/api" ||
          importPath.endsWith("/lib/api") ||
          importPath.endsWith("/lib/api.ts");

        if (isDirectTransportImport) {
          const importClause = statement.importClause;
          if (importClause && !importClause.isTypeOnly) {
            if (importClause.name) {
              violations.push(`Client component default-imports transport from '${importPath}'`);
            }
            if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
              for (const specifier of importClause.namedBindings.elements) {
                if (!specifier.isTypeOnly) {
                  const importedName = (specifier.propertyName ?? specifier.name).text;
                  if (importedName === "apiRequest") {
                    violations.push(`Client component imports shared transport 'apiRequest' directly from '${importPath}'`);
                  }
                }
              }
            }
          }
        }

        if (isServiceImport) {
          const importClause = statement.importClause;
          if (!importClause) {
            violations.push(`Side-effect import of service: ${importPath}`);
            continue;
          }

          // Type-only import (`import type { ... } from '...service'`) is permitted
          if (importClause.isTypeOnly) {
            continue;
          }

          // Default import: `import contactService from '...service'`
          if (importClause.name) {
            violations.push(`Client component default-imports service '${importPath}'`);
          }

          // Named imports: check individual bindings
          if (
            importClause.namedBindings &&
            ts.isNamedImports(importClause.namedBindings)
          ) {
            for (const specifier of importClause.namedBindings.elements) {
              if (specifier.isTypeOnly) {
                continue;
              }
              const importedName = (
                specifier.propertyName ?? specifier.name
              ).text;
              // Data-fetching / mutation functions from services (e.g. fetch*, submit*)
              if (
                /^(fetch|submit|mutate|get[A-Z]|query|post|put|delete)/.test(
                  importedName,
                )
              ) {
                violations.push(
                  `Client component imports data-access function '${importedName}' from service '${importPath}'`,
                );
              }
            }
          }

          // Namespace import: `import * as svc from '...service'`
          if (
            importClause.namedBindings &&
            ts.isNamespaceImport(importClause.namedBindings)
          ) {
            violations.push(
              `Client component imports namespace from service '${importPath}'`,
            );
          }
        }
      }
    }
  }

  return violations;
}

/**
 * Check whether a presentation component implements manual fetch effects
 * (e.g. useEffect calling fetch or service operations directly)
 */
export function findManualFetchEffects(
  sourceText: string,
  fileName = "probe.tsx",
): string[] {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
  );

  const violations: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const isEffect =
        (ts.isIdentifier(node.expression) &&
          /^(useEffect|useLayoutEffect|useInsertionEffect)$/.test(node.expression.text)) ||
        (ts.isPropertyAccessExpression(node.expression) &&
          /^(useEffect|useLayoutEffect|useInsertionEffect)$/.test(node.expression.name.text));

      if (isEffect) {
        const effectArg = node.arguments[0];
        if (
          effectArg &&
          (ts.isArrowFunction(effectArg) || ts.isFunctionExpression(effectArg))
        ) {
          const bodyText = effectArg.body.getText(sourceFile);
          if (
            /(?<!\w)fetch\s*\(/.test(bodyText) ||
            /(?<!\w)fetch[A-Z]\w*\s*\(/.test(bodyText) ||
            /(?<!\w)submit[A-Z]\w*\s*\(/.test(bodyText) ||
            /(?<!\w)apiRequest\s*\(/.test(bodyText)
          ) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(
              node.getStart(sourceFile),
            );
            violations.push(
              `Manual fetch effect detected at line ${line + 1}: ${bodyText.slice(0, 60)}...`,
            );
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

describe("Data-access architecture structural enforcement", () => {
  describe("Shared transport exclusivity (@/lib/api)", () => {
    it("permits fetch calls only in src/lib/api.ts across all production source files", () => {
      const sourceFiles = getProductionSourceFiles(srcDir);
      expect(sourceFiles.length).toBeGreaterThan(20);

      const violations: { file: string; line: number; text: string }[] = [];

      for (const file of sourceFiles) {
        const relPath = relative(frontendRoot, file).replace(/\\/g, "/");
        if (ALLOWED_FETCH_FILES.has(relPath)) {
          continue;
        }

        const source = readFileSync(file, "utf8");
        const calls = findDirectFetchCalls(source, file);
        for (const call of calls) {
          violations.push({ file: relPath, ...call });
        }
      }

      expect(violations).toEqual([]);
    });

    it("verifies that src/lib/api.ts is present and correctly contains the authorized fetch transport", () => {
      const apiFile = join(srcDir, "lib/api.ts");
      const content = readFileSync(apiFile, "utf8");
      const calls = findDirectFetchCalls(content, apiFile);
      expect(calls.length).toBeGreaterThan(0);
    });

    it("detects forbidden direct fetch calls in probe snippets", () => {
      const forbiddenProbes = [
        'const res = await fetch("/api/v1/blogs");',
        'const data = await window.fetch("/api/v1/gallery");',
        'const out = await globalThis.fetch("/api/v1/consent");',
        'function load() { return fetch("/api/v1/leads"); }',
      ];

      for (const code of forbiddenProbes) {
        const calls = findDirectFetchCalls(code, "probe.tsx");
        expect(calls.length).toBeGreaterThan(0);
      }
    });

    it("allows non-fetch methods like refetch() or identifiers in probe snippets", () => {
      const allowedProbes = [
        'const { refetch } = useQuery(); refetch();',
        'const secFetchDest = request.headers.get("sec-fetch-dest");',
        'const prefetch = () => router.prefetch("/blog");',
        '// Comments mentioning fetch should be ignored',
        'const config = { mode: "no-cors", fetchPolicy: "network-only" };',
      ];

      for (const code of allowedProbes) {
        const calls = findDirectFetchCalls(code, "probe.tsx");
        expect(calls).toEqual([]);
      }
    });
  });

  describe("Client presentation component service import boundary", () => {
    it("ensures no client component in src/ imports data-fetching functions from *.service.ts", () => {
      const sourceFiles = getProductionSourceFiles(srcDir);
      const violations: { file: string; violation: string }[] = [];

      for (const file of sourceFiles) {
        const relPath = relative(frontendRoot, file).replace(/\\/g, "/");
        const source = readFileSync(file, "utf8");
        const fileViolations = findClientServiceImportViolations(source, file);

        for (const v of fileViolations) {
          violations.push({ file: relPath, violation: v });
        }
      }

      expect(violations).toEqual([]);
    });

    it("flags client components importing data-fetching functions, default services, or transport in probe snippets", () => {
      const forbiddenClientProbes = [
        '"use client";\nimport { fetchBlogList } from "@/features/blogs/services/blogs.service";',
        '"use client";\nimport { fetchGalleryCases } from "../services/gallery.service";',
        '"use client";\nimport { fetchConsent, submitContact } from "@/features/contact/services/contact.service";',
        '"use client";\nimport { fetchProcedures } from "../services/procedures.service";',
        '"use client";\nimport contactService from "@/features/contact/services/contact.service";',
        '"use client";\nimport { apiRequest } from "@/lib/api";',
      ];

      for (const probe of forbiddenClientProbes) {
        const violations = findClientServiceImportViolations(probe, "ProbeClient.tsx");
        expect(violations.length).toBeGreaterThan(0);
      }
    });

    it("permits Server Components and type imports from services in probe snippets", () => {
      const allowedProbes = [
        // Server component (no "use client")
        'import { fetchBlogList } from "@/features/blogs/services/blogs.service";\nexport async function BlogList() { await fetchBlogList({ lang: "en", page: 1, pageSize: 10 }); }',
        // Client component importing types only
        '"use client";\nimport type { ProcedureOption } from "@/features/procedures/services/procedures.service";',
        // Client component importing typed error classes
        '"use client";\nimport { ContactApiError } from "@/features/contact/services/contact.service";',
      ];

      for (const probe of allowedProbes) {
        const violations = findClientServiceImportViolations(probe, "ProbeAllowed.tsx");
        expect(violations).toEqual([]);
      }
    });
  });

  describe("Manual fetch effects & state mirroring invariants", () => {
    it("ensures presentation components do not implement manual fetch effects", () => {
      const sourceFiles = getProductionSourceFiles(srcDir);
      const componentFiles = sourceFiles.filter(isPresentationComponentFile);
      expect(componentFiles.length).toBeGreaterThan(10);

      const violations: { file: string; violation: string }[] = [];

      for (const file of componentFiles) {
        const relPath = relative(frontendRoot, file).replace(/\\/g, "/");
        const source = readFileSync(file, "utf8");
        const fileViolations = findManualFetchEffects(source, file);
        for (const v of fileViolations) {
          violations.push({ file: relPath, violation: v });
        }
      }

      expect(violations).toEqual([]);
    });

    it("detects manual fetch effects in probe snippets", () => {
      const forbiddenEffectProbes = [
        'useEffect(() => { fetch("/api/data").then(setData); }, []);',
        'React.useEffect(() => { fetchBlogList({ lang: "en", page: 1, pageSize: 5 }); }, []);',
        'useLayoutEffect(() => { submitContact(values); }, [values]);',
      ];

      for (const probe of forbiddenEffectProbes) {
        const violations = findManualFetchEffects(probe, "ProbeEffect.tsx");
        expect(violations.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Feature query key invariants", () => {
    beforeAll(async () => {
      const procMod = await loadFeatureModule<{ proceduresKeys: ProceduresKeysShape }>(
        "../features/procedures/hooks/useProcedures",
      );
      proceduresKeys = procMod.proceduresKeys;

      const contactMod = await loadFeatureModule<{ contactKeys: ContactKeysShape }>(
        "../features/contact/hooks/useConsent",
      );
      contactKeys = contactMod.contactKeys;

      const blogMod = await loadFeatureModule<{ blogKeys: BlogKeysShape }>(
        "../features/blogs/hooks/useBlogHome",
      );
      blogKeys = blogMod.blogKeys;

      const galleryMod = await loadFeatureModule<{ galleryKeys: GalleryKeysShape }>(
        "../features/gallery/hooks/useLandingGallery",
      );
      galleryKeys = galleryMod.galleryKeys;
    });

    describe("proceduresKeys", () => {
      it("provides a stable root query key", () => {
        expect(proceduresKeys.all).toEqual(["procedures"]);
        expect(JSON.stringify(proceduresKeys.all)).toBe('["procedures"]');
      });
    });

    describe("contactKeys", () => {
      it("scopes consent queries by locale and preserves root key prefix", () => {
        expect(contactKeys.all).toEqual(["contact"]);
        expect(contactKeys.consent("en")).toEqual(["contact", "consent", "en"]);
        expect(contactKeys.consent("ar")).toEqual(["contact", "consent", "ar"]);
        expect(contactKeys.consent("en")).not.toEqual(contactKeys.consent("ar"));
        expect(JSON.stringify(contactKeys.consent("en"))).toBe('["contact","consent","en"]');
      });
    });

    describe("blogKeys", () => {
      it("scopes blog home queries by locale and preserves root key prefix", () => {
        expect(blogKeys.all).toEqual(["blogs"]);
        expect(blogKeys.home("en")).toEqual(["blogs", "home", "en"]);
        expect(blogKeys.home("ar")).toEqual(["blogs", "home", "ar"]);
        expect(blogKeys.home("en")).not.toEqual(blogKeys.home("ar"));
        expect(JSON.stringify(blogKeys.home("en"))).toBe('["blogs","home","en"]');
      });
    });

    describe("galleryKeys", () => {
      it("scopes landing gallery queries by locale", () => {
        expect(galleryKeys.all).toEqual(["gallery"]);
        expect(galleryKeys.landing("en")).toEqual(["gallery", "landing", "en"]);
        expect(galleryKeys.landing("ar")).toEqual(["gallery", "landing", "ar"]);
        expect(galleryKeys.landing("en")).not.toEqual(galleryKeys.landing("ar"));
      });

      it("scopes gallery list queries by locale and every active filter dimension", () => {
        const keyDefault = galleryKeys.list("en");
        const keyPage2 = galleryKeys.list("en", { page: 2 });
        const keyRhino = galleryKeys.list("en", { procedure_tag: "rhinoplasty" });
        const keyAr = galleryKeys.list("ar");

        expect(keyDefault[0]).toBe("gallery");
        expect(keyDefault[1]).toBe("list");
        expect(keyDefault[2]).toBe("en");

        // Verify distinct parameters produce distinct query keys
        expect(keyDefault).not.toEqual(keyPage2);
        expect(keyDefault).not.toEqual(keyRhino);
        expect(keyDefault).not.toEqual(keyAr);

        // Verify all query keys are serializable
        expect(() => JSON.stringify(keyDefault)).not.toThrow();
        expect(() => JSON.stringify(keyRhino)).not.toThrow();
      });
    });
  });

  describe("Repository policy documentation invariants", () => {
    it("verifies frontend/AGENTS.md codifies the permanent data-access architecture", () => {
      const agentsMd = readFileSync(join(frontendRoot, "AGENTS.md"), "utf8");

      expect(agentsMd).toContain("app/component -> feature hook -> feature service -> shared API transport");
      expect(agentsMd).toContain("@/lib/api");
      expect(agentsMd).toContain("must begin with `use`");
      expect(agentsMd).toContain("TanStack Query");
    });

    it("verifies frontend/ARCHITECTURE.md codifies the data-access architecture layer", () => {
      const archMd = readFileSync(join(frontendRoot, "ARCHITECTURE.md"), "utf8");

      expect(archMd).toContain("app/component -> feature hook -> feature service -> shared API transport");
      expect(archMd).toContain("src/lib/api.ts");
      expect(archMd).toContain("start with `use`");
      expect(archMd).toContain("TanStack Query");
    });
  });
});
