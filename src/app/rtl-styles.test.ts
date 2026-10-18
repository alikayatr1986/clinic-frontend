import { join } from "node:path";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
function ruleBody(selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`^[ \\t]*${escaped}\\s*\\{([^}]*)\\}`, "m"));
  return match ? match[1] : null;
}
describe("RTL typography contract (:lang(ar))", () => {
  it("keeps the Arabic line-height on the document root", () => {
  const body = ruleBody("html:lang(ar)");
  expect(body, "html:lang(ar) rule must exist in globals.css").not.toBeNull();
  expect(body).toContain("line-height: 1.65");
  });
  it("keeps an Arabic-first font stack on :lang(ar)", () => {
  const body = ruleBody(":lang(ar)");
  expect(body, ":lang(ar) rule must exist in globals.css").not.toBeNull();
  const fontFamily = body!.match(/font-family:\s*([^;]+);/)?.[1];
  expect(fontFamily, ":lang(ar) must declare font-family").toBeDefined();
  const stack = fontFamily!.split(",").map((value) => value.trim());
  expect(stack[0]).toBe("var(--font-noto-arabic)");
  expect(fontFamily!.indexOf("var(--font-noto-arabic)")).toBeLessThan(fontFamily!.indexOf("var(--font-manrope)"));
  });
  it("declares the document contract before the generic :lang(ar) block", () => {
  const documentRule = css.indexOf("html:lang(ar)");
  const genericRule = css.match(/^[ \t]*:lang\(ar\)\s*\{/m)?.index ?? -1;
  expect(documentRule, "html:lang(ar) rule must exist").toBeGreaterThan(-1);
  expect(genericRule, ":lang(ar) rule must exist at line start").toBeGreaterThan(-1);
  expect(documentRule).toBeLessThan(genericRule);
  });
});
