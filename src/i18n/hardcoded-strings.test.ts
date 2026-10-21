// @vitest-environment node
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";

const FRONTEND_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const REQUIRED_SCAN_ROOTS = new Set(["src/app", "src/components", "src/features"]);

const SCAN_ROOTS = [
  "src/app",
  "src/components",
  "src/features",
  "src/constants",
  "src/utils",
  "src/types",
  "src/styles",
  "src/lib",
] as const;

const EXCLUDED_DIR_NAMES = ["color-smoke"];

const EXCLUDED_FILE = /\.test\.|\.stories\./;

const ALLOWED_FILES = ["src/constants/locale.constants.ts"];

const USER_VISIBLE_ATTRS = [
  "aria-label",
  "aria-placeholder",
  "aria-roledescription",
  "aria-valuetext",
  "aria-description",
  "alt",
  "placeholder",
  "title",
];

const ATTR_PATTERN = new RegExp(
  `\\b(${USER_VISIBLE_ATTRS.join("|")})\\s*[:=]\\s*(['"\`])((?:\\\\.|[^\\n])*?)\\2`,
  "g",
);
const JSX_TEXT_PATTERN = />([^<>{}]+?)</g;
const HAS_LETTER = /[\p{L}]/u;

interface Violation {
  file: string;
  line: number;
  rule: "attribute" | "jsx-text";
  value: string;
}

function stripComments(source: string): string {
  const blank = (match: string) => " ".repeat(match.length);
  return (
    source
      // Block comments and JSX `{/* … */}` comments.
      .replace(/\/\*[\s\S]*?\*\//g, blank)
      // Line comments, sparing `://` inside URLs and strings.
      .replace(/(^|[^:\\])\/\/[^\n]*/g, (_match, lead: string) => lead + " ".repeat(_match.length - lead.length))
  );
}

function scanAttributeValue(value: string): boolean {
  const trimmed = value.trim();

  if (trimmed.length < 2) return false;
  return HAS_LETTER.test(trimmed);
}

function audit(frontendRoot: string = FRONTEND_ROOT): Violation[] {
  const violations: Violation[] = [];
  for (const root of SCAN_ROOTS) {
    const absoluteRoot = join(frontendRoot, root);
    if (REQUIRED_SCAN_ROOTS.has(root) && !existsSync(absoluteRoot)) {
      throw new Error(`Required translation audit root is missing: ${root}`);
    }
    for (const path of collectSourceFiles(absoluteRoot)) {
      const sourcePath = relative(frontendRoot, path).split(sep).join("/");
      if (EXCLUDED_FILE.test(sourcePath) || ALLOWED_FILES.includes(sourcePath)) continue;
      const source = stripComments(readFileSync(path, "utf8"));

      for (const match of source.matchAll(ATTR_PATTERN)) {
        const [, name, , value] = match;
        if (scanAttributeValue(value)) {
          violations.push({
            file: sourcePath,
            line: lineOf(source, match.index ?? 0),
            rule: "attribute",
            value: `${name}: ${JSON.stringify(value.trim())}`,
          });
        }
      }

      for (const match of source.matchAll(JSX_TEXT_PATTERN)) {
        const text = match[1].trim();

        if (
          HAS_LETTER.test(text) &&
          !/["'&]/.test(text) &&

          /^[\p{L}\p{N}]/u.test(text)
        ) {
          violations.push({
            file: sourcePath,
            line: lineOf(source, (match.index ?? 0) + 1),
            rule: "jsx-text",
            value: JSON.stringify(text),
          });
        }
      }
    }
  }
  return violations;
}

function collectSourceFiles(root: string): string[] {
  const files: string[] = [];
  if (!existsSync(root)) return files;
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    for (const entry of readdirSync(join(dir), { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        if (EXCLUDED_DIR_NAMES.includes(entry.name)) continue;
        stack.push(path);
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        files.push(path);
      }
    }
  }
  return files;
}

function lineOf(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (source[i] === "\n") line += 1;
  }
  return line;
}

describe("hardcoded-strings audit (CAP-5, spec-frontend-i18n-rtl story 5)", () => {
  it("audits nested feature source and still reports untranslated copy", () => {
    const root = mkdtempSync(join(tmpdir(), "feature-translation-audit-"));
    try {
      for (const required of REQUIRED_SCAN_ROOTS) mkdirSync(join(root, required), { recursive: true });
      const feature = join(root, "src/features/landing/components");
      mkdirSync(feature, { recursive: true });
      const source = join(feature, "Example.tsx");
      writeFileSync(source, '<section aria-label="Untranslated label">Untranslated copy</section>');
      expect(audit(root)).toEqual([
        { file: "src/features/landing/components/Example.tsx", line: 1, rule: "attribute", value: 'aria-label: "Untranslated label"' },
        { file: "src/features/landing/components/Example.tsx", line: 1, rule: "jsx-text", value: '"Untranslated copy"' },
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("allows absent optional global categories after their files move", () => {
    const root = mkdtempSync(join(tmpdir(), "missing-translation-root-"));
    try {
      for (const required of REQUIRED_SCAN_ROOTS) mkdirSync(join(root, required), { recursive: true });
      expect(audit(root)).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it.each(["src/app", "src/components", "src/features"])("rejects a missing required %s root", (missing) => {
    const root = mkdtempSync(join(tmpdir(), "required-translation-root-"));
    try {
      for (const required of REQUIRED_SCAN_ROOTS) {
        if (required !== missing) mkdirSync(join(root, required), { recursive: true });
      }
      expect(() => audit(root)).toThrow(`Required translation audit root is missing: ${missing}`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("finds zero user-visible string literals outside the allowlist independently of cwd", () => {
    const cwd = vi.spyOn(process, "cwd").mockReturnValue(tmpdir());
    let violations: Violation[];
    try {
      violations = audit();
    } finally {
      cwd.mockRestore();
    }
    expect(
      violations,
      violations
        .map(
          (v) =>
            `${v.file}:${v.line} [${v.rule}] user-visible literal ${v.value} — route copy through next-intl t()/getTranslations() (see _bmad-output/specs/spec-frontend-i18n-rtl/text-inventory.md)`,
        )
        .join("\n"),
    ).toEqual([]);
  });
});
