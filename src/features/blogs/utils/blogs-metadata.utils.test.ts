import { afterEach, describe, expect, it, vi } from "vitest";

import {
  absoluteUrl,
  buildArticleJsonLd,
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
  });

  it("escapes script terminators in JSON-LD", () => {
    vi.stubEnv("SITE_URL", "https://example.com/ignored");
    const ld = buildArticleJsonLd(post, "Home", "Articles");
    const s = serializeJsonLd(ld);
    expect(s).not.toMatch(/<|>|\u2028/);
    expect(JSON.parse(s)[0].headline).toBe(post.title);
    expect(JSON.parse(s)[0].mainEntityOfPage["@id"]).toBe("https://example.com/blog/a%20b");
  });

  it("indexes only the unfiltered first list page", () => {
    vi.stubEnv("SITE_URL", "https://example.com");
    const base = { q: "", category: "", page: 1 };
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
