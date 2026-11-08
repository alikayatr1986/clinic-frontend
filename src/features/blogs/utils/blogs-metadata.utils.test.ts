import { afterEach, describe, expect, it, vi } from "vitest";

import {
  absoluteUrl,
  buildArticleJsonLd,
  buildArticleMetadata,
  buildListMetadata,
  serializeJsonLd,
} from "./blogs-metadata.utils";
import type { BlogDetail } from "@/features/blogs/types/blogs.types";

const post = {
  slug: "a b",
  lang: "en",
  title: "T </script><script>alert(1)</script>\u2028",
  excerpt: "E",
  author_name: "Dr",
  first_published_at: "2026-01-01T00:00:00Z",
  last_published_at: "2026-01-02T00:00:00Z",
  cover: null,
} as unknown as BlogDetail;

afterEach(() => vi.unstubAllEnvs());

describe("blog metadata", () => {
  it("omits absolute URLs and JSON-LD without a valid SITE_URL", () => {
    vi.stubEnv("SITE_URL", "not a url");
    expect(absoluteUrl("/blog")).toBeNull();
    expect(buildArticleJsonLd(post, "Home", "Articles")).toBeNull();
    expect(buildListMetadata({ q: "", category: "", page: 1 }, "t", "d").alternates).toBeUndefined();
  });

  it("escapes script terminators in JSON-LD", () => {
    vi.stubEnv("SITE_URL", "https://example.com/ignored");
    const ld = buildArticleJsonLd(post, "Home", "Articles");
    const s = serializeJsonLd(ld);
    expect(s).not.toMatch(/<|>|\u2028/);
    expect(JSON.parse(s)[0].headline).toBe(post.title);
    expect(JSON.parse(s)[0].mainEntityOfPage["@id"]).toBe("https://example.com/blog/a%20b");
  });

  it("preserves article-specific metadata and cover", () => {
    vi.stubEnv("SITE_URL", "https://example.com");
    const article = { ...post, seo_title: "SEO title", seo_description: "SEO description", cover: { url: "/cover.jpg", width: 1200, height: 630, alt: "Cover" } } as BlogDetail;
    expect(buildArticleMetadata(article)).toMatchObject({ title: "SEO title", description: "SEO description", alternates: { canonical: "https://example.com/blog/a%20b" }, openGraph: { type: "article", publishedTime: post.first_published_at, modifiedTime: post.last_published_at, images: [{ url: "https://example.com/cover.jpg" }] }, twitter: { card: "summary_large_image", images: ["https://example.com/cover.jpg"] } });
  });

  it("indexes only the unfiltered first list page", () => {
    vi.stubEnv("SITE_URL", "https://example.com");
    const base = { q: "", category: "", page: 1 };
    expect(buildListMetadata(base, "t", "d")).toMatchObject({ openGraph: { title: "t", description: "d", url: "https://example.com/blog" }, twitter: { card: "summary", title: "t", description: "d" } });
    expect(buildListMetadata(base, "t", "d").robots).toBeUndefined();
    expect(buildListMetadata({ ...base, q: "x" }, "t", "d")).toMatchObject({
      robots: { index: false, follow: true },
      alternates: { canonical: "https://example.com/blog" },
    });
    expect(buildListMetadata({ ...base, page: 2 }, "t", "d")).toMatchObject({
      robots: { index: false, follow: true },
      alternates: { canonical: "https://example.com/blog?page=2" },
    });
  });
});
