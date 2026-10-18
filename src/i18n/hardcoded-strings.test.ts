import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SCAN_ROOTS = [
  "src/app",
  "src/components",
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

function audit(): Violation[] {
  const violations: Violation[] = [];
  for (const root of SCAN_ROOTS) {
    for (const path of collectSourceFiles(root)) {
      if (EXCLUDED_FILE.test(path) || ALLOWED_FILES.includes(path)) continue;
      const source = stripComments(readFileSync(path, "utf8"));

      for (const match of source.matchAll(ATTR_PATTERN)) {
        const [, name, , value] = match;
        if (scanAttributeValue(value)) {
          violations.push({
            file: path,
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
            file: path,
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
  it("finds zero user-visible string literals outside the allowlist", () => {
    const violations = audit();
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