// @vitest-environment node
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

const frontendRoot = fileURLToPath(new URL("../../", import.meta.url));
const eslint = new ESLint({ cwd: frontendRoot });
const boundaryRule = "architecture/dependency-boundaries";

const forbidden = [
  ["shared alias import", "src/components/layout/Probe.tsx", 'import { HeroSection } from "@/features/landing/components/HeroSection";'],
  ["shared relative import", "src/utils/Probe.ts", 'import { NAV_ITEMS } from "../features/landing/constants/nav.constants";'],
  ["named re-export", "src/constants/Probe.ts", 'export { NAV_ITEMS } from "@/features/landing/constants/nav.constants";'],
  ["star re-export", "src/utils/Probe.ts", 'export * from "../features/landing/constants/nav.constants";'],
  ["dynamic string import", "src/hooks/Probe.ts", 'const load = () => import("@/features/landing/constants/nav.constants");'],
  ["dynamic static template import", "src/hooks/Probe.ts", 'const load = () => import(`@/features/landing/constants/nav.constants`);'],
  ["dynamic relative static template", "src/utils/Probe.ts", 'const load = () => import(`../features/landing/constants/nav.constants`);'],
  ["TypeScript import type", "src/types/Probe.ts", 'type Example = import("@/features/landing/components/HeroSection").HeroSection;'],
  ["CommonJS string require", "src/lib/Probe.ts", 'const data = require("../features/landing/constants/nav.constants");'],
  ["CommonJS template require", "src/lib/Probe.ts", 'const data = require(`../features/landing/constants/nav.constants`);'],
  ["TypeScript import equals", "src/types/Probe.ts", 'import data = require("@/features/landing/constants/nav.constants");'],
  ["CTS source", "src/utils/Probe.cts", 'import data = require("../features/landing/constants/nav.constants");'],
  ["CJS source", "src/utils/Probe.cjs", 'const data = require("../features/landing/constants/nav.constants");'],
  ["MTS source", "src/utils/Probe.mts", 'export * from "../features/landing/constants/nav.constants";'],
  ["MJS source", "src/utils/Probe.mjs", 'export * from "../features/landing/constants/nav.constants";'],
  ["JS source", "src/utils/Probe.js", 'export * from "../features/landing/constants/nav.constants";'],
  ["JSX source", "src/components/Probe.jsx", 'import { HeroSection } from "@/features/landing/components/HeroSection";'],
  ["shared route alias", "src/components/layout/Probe.tsx", 'import Home from "@/app/page";'],
  ["shared route relative", "src/utils/Probe.ts", 'export * from "../app/page";'],
  ["shared route template", "src/hooks/Probe.ts", 'const load = () => import(`@/app/page`);'],
  ["shared route import equals", "src/types/Probe.cts", 'import page = require("@/app/page");'],
  ["feature route relative", "src/features/landing/components/Probe.tsx", 'import Home from "../../../app/page";'],
  ["feature route re-export", "src/features/landing/components/Probe.tsx", 'export { default } from "@/app/page";'],
  ["feature route template", "src/features/landing/components/Probe.tsx", 'const load = () => import(`@/app/page`);'],
  ["feature route import equals", "src/features/landing/Probe.cts", 'import page = require("../../app/page");'],
] as const;

const allowed = [
  ["route to feature", "src/app/Probe.tsx", 'import { LandingPage } from "@/features/landing/components/LandingPage";'],
  ["route to shared", "src/app/Probe.tsx", 'import { SiteHeader } from "@/components/layout/SiteHeader";'],
  ["feature to shared", "src/features/landing/components/Probe.tsx", 'import { SiteHeader } from "@/components/layout/SiteHeader";'],
  ["shared to shared", "src/components/layout/Probe.tsx", 'import { Button } from "../ui/button";'],
  ["shared template to shared", "src/hooks/Probe.ts", 'const load = () => import(`@/utils/nav.utils`);'],
  ["shared CommonJS to shared", "src/utils/Probe.cjs", 'const data = require("../constants/header.constants");'],
  ["shared import equals to shared", "src/utils/Probe.cts", 'import data = require("../constants/header.constants");'],
  ["external package", "src/utils/Probe.ts", 'import path from "node:path";'],
] as const;

describe("frontend dependency boundaries (actual ESLint configuration)", () => {
  beforeAll(async () => {
    await eslint.lintText("export {};", { filePath: "src/components/layout/Probe.tsx" });
  }, 30_000);

  it.each(forbidden)("rejects %s", async (_label, filePath, code) => {
    const [result] = await eslint.lintText(code, { filePath });
    expect(result.messages.filter(message => message.fatal)).toEqual([]);
    expect(result.messages.filter(message => message.ruleId === boundaryRule)).toHaveLength(1);
  });

  it.each(allowed)("allows %s", async (_label, filePath, code) => {
    const [result] = await eslint.lintText(code, { filePath });
    expect(result.messages.filter(message => message.fatal)).toEqual([]);
    expect(result.messages.filter(message => message.ruleId === boundaryRule)).toEqual([]);
    expect(result.messages.some(message => /ignored|no matching configuration/i.test(message.message))).toBe(false);
  });
});
