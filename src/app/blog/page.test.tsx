import { afterEach, describe, expect, it, vi } from "vitest";
import arMessages from "../../../messages/ar.json";
import enMessages from "../../../messages/en.json";

const translations = vi.hoisted(() => vi.fn());
vi.mock("next-intl/server", () => ({ getTranslations: translations }));

import { generateMetadata } from "@/app/blog/page";

afterEach(() => vi.unstubAllEnvs());

describe("blog listing metadata", () => {
  it.each([enMessages, arMessages])("uses the locale's listing copy for sharing", async (messages) => {
    vi.stubEnv("SITE_URL", "https://medcation.care");
    translations.mockResolvedValue((key: string) => messages.blogs[key as "pageTitle" | "pageDescription"]);
    const title = messages.blogs.pageTitle;
    const description = messages.blogs.pageDescription;
    expect(await generateMetadata({ searchParams: Promise.resolve({}) })).toMatchObject({
      title, description,
      alternates: { canonical: "https://medcation.care/blog" },
      openGraph: { title, description, url: "https://medcation.care/blog" },
      twitter: { card: "summary", title, description },
    });
  });
  it.each([
    [{ category: "skin" }, "https://medcation.care/blog"],
    [{ category: ["skin", "hair"] }, "https://medcation.care/blog"],
    [{ q: "care" }, "https://medcation.care/blog"],
    [{ page: "2" }, "https://medcation.care/blog?page=2"],
  ])("marks filtered and paged results noindex: %j", async (params, canonical) => {
    vi.stubEnv("SITE_URL", "https://medcation.care");
    translations.mockResolvedValue((key: string) => enMessages.blogs[key as "pageTitle" | "pageDescription"]);
    expect(await generateMetadata({ searchParams: Promise.resolve(params) })).toMatchObject({
      robots: { index: false, follow: true },
      alternates: { canonical },
    });
  });
});
