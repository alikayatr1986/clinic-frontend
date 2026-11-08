import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from "next-intl";
import arMessages from '../../messages/ar.json';
import enMessages from '../../messages/en.json';
import RootLayout, { generateMetadata } from '@/app/layout';
import { generateMetadata as generateHomeMetadata } from "@/app/page";
import { QueryProvider } from "@/lib/query-client-provider";
vi.mock("next/font/google", () => ({
  Libre_Caslon_Display: () => ({ variable: "font-mock-libre-caslon-display" }),
  Manrope: () => ({ variable: "font-mock-manrope" }),
  Noto_Sans_Arabic: () => ({ variable: "font-mock-noto-arabic" }),
  Geist_Mono: () => ({ variable: "font-mock-geist-mono" }),
}));
const nextIntlServer = vi.hoisted(() => ({
  getLocale: vi.fn(),
  getTranslations: vi.fn(),
}));
vi.mock("next-intl/server", () => nextIntlServer);
type TestLocale = "en" | "ar";
function namespaceTranslator(locale: TestLocale) {
  function resolve(tree: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], tree);
  }
  return (namespace: string) => {
  const tree = locale === "ar" ? arMessages : enMessages;
  const scope = namespace ? resolve(tree, namespace) : tree;
  return (key: string) => resolve(scope, key) as string;
  };
}
function serveLocale(locale: TestLocale) {
  nextIntlServer.getLocale.mockResolvedValue(locale);
  nextIntlServer.getTranslations.mockImplementation(namespaceTranslator(locale));
}
function layoutProps(children: React.ReactNode): Parameters<typeof RootLayout>[0] {
  return { children } as Parameters<typeof RootLayout>[0];
}
describe('RootLayout (localization seam)', () => {
  it('serves lang="ar" dir="rtl" for the ar locale', async () => {
  serveLocale("ar");
  const html = await RootLayout(layoutProps(<p data-slot="page">Page</p>));
  expect(html.type).toBe("html");
  expect(html.props).toMatchObject({ lang: "ar", dir: "rtl" });
  });
  it('serves lang="en" dir="ltr" for the en locale', async () => {
  serveLocale("en");
  const html = await RootLayout(layoutProps(<p data-slot="page">Page</p>));
  expect(html.type).toBe("html");
  expect(html.props).toMatchObject({ lang: "en", dir: "ltr" });
  });
  it('adds the scoped hero font variable alongside the body fonts', async () => {
    serveLocale("en");
    const html = await RootLayout(layoutProps(<p>Page</p>));
    expect(html.props.className).toContain("font-mock-libre-caslon-display");
    expect(html.props.className).toContain("font-mock-manrope");
    expect(html.props.className).toContain("font-mock-noto-arabic");
  });
  it('wraps the page in the Query provider inside the intl boundary', async () => {
    serveLocale("en");
    type TestElement = React.ReactElement<{
      children?: React.ReactNode;
      "data-slot"?: string;
    }>;
    const html = await RootLayout(
      layoutProps(<p data-slot="page">Page</p>),
    );

    const body = React.Children.only(html.props.children) as TestElement;
    expect(body.type).toBe("body");

    const intl = React.Children.only(body.props.children) as TestElement;
    expect(intl.type).toBe(NextIntlClientProvider);

    const provider = React.Children.only(intl.props.children) as TestElement;
    expect(provider.type).toBe(QueryProvider);

    const page = React.Children.only(provider.props.children) as TestElement;
    expect(page.props["data-slot"]).toBe("page");
  });
  it.each(["en", "ar"] as const)("generates localized sharing metadata for %s", async (locale) => {
    vi.stubEnv("SITE_URL", "https://medcation.care");
    serveLocale(locale);
    const { title, description } = (locale === "en" ? enMessages : arMessages).metadata;
    expect(await generateMetadata()).toMatchObject({ title, description, openGraph: { title, description }, twitter: { card: "summary", title, description } });
    expect((await generateMetadata()).alternates).toBeUndefined();
    expect(await generateHomeMetadata()).toMatchObject({ alternates: { canonical: "https://medcation.care/" }, openGraph: { title, description, url: "https://medcation.care/" } });
    vi.stubEnv("SITE_URL", "invalid");
    expect((await generateHomeMetadata()).alternates).toBeUndefined();
    vi.unstubAllEnvs();
  });
});
