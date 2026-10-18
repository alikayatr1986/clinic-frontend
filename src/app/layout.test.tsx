import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import arMessages from '../../messages/ar.json';
import enMessages from '../../messages/en.json';
import RootLayout, { generateMetadata } from '@/app/layout';
vi.mock("next/font/google", () => ({
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
  it('generateMetadata resolves the metadata namespace per locale (en byte-identical to messages/en.json)', async () => {
  serveLocale("en");
  expect(await generateMetadata()).toEqual({
  title: enMessages.metadata.title,
  description: enMessages.metadata.description,
  });
  serveLocale("ar");
  expect(await generateMetadata()).toEqual({
  title: arMessages.metadata.title,
  description: arMessages.metadata.description,
  });
  });
});
