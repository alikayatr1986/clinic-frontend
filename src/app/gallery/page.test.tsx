import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import arMessages from "../../../messages/ar.json";
import enMessages from "../../../messages/en.json";

vi.mock("next-intl/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl/server")>();
  return {
    ...actual,
    getLocale: vi.fn(),
    getTranslations: vi.fn(),
  };
});

import { getLocale, getTranslations } from "next-intl/server";
import GalleryPage, { generateMetadata } from "@/app/gallery/page";
import {
  GALLERY_CTA_HREF,
  GALLERY_NAV_ITEMS,
} from "@/features/gallery/constants/gallery.constants";
import { axePass, themedRender } from "@/test/utils";

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
  vi.mocked(getLocale).mockResolvedValue(locale);
  vi.mocked(getTranslations).mockImplementation(
    namespaceTranslator(locale) as unknown as typeof getTranslations,
  );
}

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  const { installRouterSpies } = await import("@/test/utils");
  const spies = installRouterSpies();
  return {
    ...actual,
    useRouter: () => spies,
    usePathname: () => "/gallery",
    useSearchParams: () => new URLSearchParams(),
  };
});

vi.mock("@/features/gallery/services/gallery.service", () => ({
  fetchGalleryCases: vi.fn().mockResolvedValue({
    data: [],
    page: 1,
    page_size: 12,
    total: 0,
  }),
  fetchGalleryContent: vi.fn().mockResolvedValue({
    section: null,
    captions: {},
  }),
}));

describe("GalleryPage (/gallery)", () => {
  it("renders the site header, main landmark, and gallery browser", () => {
    themedRender(<GalleryPage />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByTestId("gallery-browser")).toBeInTheDocument();
  });

  it("points navigation links to landing anchor targets (/#anchor)", () => {
    themedRender(<GalleryPage />);

    for (const item of GALLERY_NAV_ITEMS) {
      expect(item.href).toMatch(/^\/#/);
      const links = screen.getAllByRole("link", {
        name: enMessages.nav[item.labelKey],
      });
      expect(links.length).toBeGreaterThan(0);
      for (const link of links) {
        expect(link).toHaveAttribute("href", item.href);
      }
    }
  });

  it("points the consultation CTA to /#contact", () => {
    themedRender(<GalleryPage />);

    const ctaLinks = screen.getAllByRole("link", {
      name: new RegExp(enMessages.header.cta, "i"),
    });
    expect(ctaLinks.length).toBeGreaterThan(0);
    for (const cta of ctaLinks) {
      expect(cta).toHaveAttribute("href", GALLERY_CTA_HREF);
    }
  });

  it("generates page metadata with localized title and description", async () => {
    serveLocale("en");
    const metaEn = await generateMetadata();
    expect(metaEn.title).toBe(enMessages.gallery.pageTitle);
    expect(metaEn.description).toBe(enMessages.gallery.pageDescription);

    serveLocale("ar");
    const metaAr = await generateMetadata();
    expect(metaAr.title).toBe(arMessages.gallery.pageTitle);
    expect(metaAr.description).toBe(arMessages.gallery.pageDescription);
  });

  it("passes axe accessibility checks", async () => {
    const { container } = themedRender(<GalleryPage />);
    await axePass(container);
  });
});