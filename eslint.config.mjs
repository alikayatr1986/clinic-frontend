// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const sourceRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "src");
const sharedRoots = /^(components|hooks|constants|types|styles|utils|lib|i18n|test)\//;

const dependencyBoundaries = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      sharedDependency: "Shared modules must not import feature or route implementations; pass configuration through props.",
      featureRoute: "Features must not import route implementations from app; compose them in the route.",
    },
  },
  create(context) {
    const owner = path.relative(sourceRoot, context.filename).split(path.sep).join("/");
    function staticSpecifier(source) {
      if (typeof source?.value === "string") return source.value;
      if (source?.type === "TemplateLiteral" && source.expressions.length === 0) {
        return source.quasis[0].value.cooked;
      }
      return null;
    }
    function check(node, source) {
      const specifier = staticSpecifier(source);
      if (specifier === null) return;
      const targetPath = specifier.startsWith("@/")
        ? path.join(sourceRoot, specifier.slice(2))
        : specifier.startsWith(".")
          ? path.resolve(path.dirname(context.filename), specifier)
          : null;
      if (!targetPath) return;
      const target = path.relative(sourceRoot, targetPath).split(path.sep).join("/");
      if (sharedRoots.test(owner) && /^(features|app)(\/|$)/.test(target)) {
        context.report({ node, messageId: "sharedDependency" });
      } else if (owner.startsWith("features/") && /^(app)(\/|$)/.test(target)) {
        context.report({ node, messageId: "featureRoute" });
      }
    }
    return {
      ImportDeclaration: (node) => check(node, node.source),
      ExportNamedDeclaration: (node) => check(node, node.source),
      ExportAllDeclaration: (node) => check(node, node.source),
      ImportExpression: (node) => check(node, node.source),
      TSImportType: (node) => check(node, node.source),
      TSExternalModuleReference: (node) => check(node, node.expression),
      CallExpression: (node) => {
        if (node.callee.type === "Identifier" && node.callee.name === "require") {
          check(node, node.arguments[0]);
        }
      },
    };
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{js,jsx,ts,tsx,mjs,mts,cjs,cts}"],
    plugins: { architecture: { rules: { "dependency-boundaries": dependencyBoundaries } } },
    rules: { "architecture/dependency-boundaries": "error" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Built Storybook output and coverage reports (gitignored; keep them out of lint runs).
    "storybook-static/**",
    "coverage/**",
  ]),
  ...storybook.configs["flat/recommended"]
]);

export default eslintConfig;
