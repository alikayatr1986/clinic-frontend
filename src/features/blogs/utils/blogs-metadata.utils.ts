import type { Metadata } from "next";

import type { BlogDetail } from "@/features/blogs/types/blogs.types";

/**
 * Canonical site origin from explicit config only, never the Host header.
 * Returns null when absent or invalid (dev); production release requires it.
 */
export function siteOrigin(): string | null {
  const raw = process.env.SITE_URL;
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:" ? u.origin : null;
  } catch {
    return null;
  }
}

export function absoluteUrl(path: string): string | null {
  const origin = siteOrigin();
  return origin ? `${origin}${path}` : null;
}

export function articlePath(slug: string): string {
  return `/blog/${encodeURIComponent(slug)}`;
}

/** Serializes JSON-LD for an inline script: no `</script>`, HTML comment or line-separator breakouts. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function buildArticleMetadata(post: BlogDetail): Metadata {
  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt;
  const canonical = absoluteUrl(articlePath(post.slug));
  const image = post.cover ? absoluteUrl(post.cover.url) : null;
  const images = image
    ? [{ url: image, width: post.cover?.width, height: post.cover?.height, alt: post.cover?.alt }]
    : undefined;

  return {
    title,
    description,
    ...(canonical && { alternates: { canonical } }),
    openGraph: {
      type: "article",
      title,
      description,
      ...(canonical && { url: canonical }),
      publishedTime: post.first_published_at,
      modifiedTime: post.last_published_at,
      locale: post.lang,
      images,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

/** BlogPosting + BreadcrumbList for a live article; null without a canonical origin. */
export function buildArticleJsonLd(post: BlogDetail, homeLabel: string, listLabel: string) {
  const url = absoluteUrl(articlePath(post.slug));
  const home = absoluteUrl("/");
  const list = absoluteUrl("/blog");
  if (!url || !home || !list) return null;
  const image = post.cover ? absoluteUrl(post.cover.url) : null;
  return [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      inLanguage: post.lang,
      datePublished: post.first_published_at,
      dateModified: post.last_published_at,
      author: { "@type": "Person", name: post.author_name },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      ...(image && { image: [image] }),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: homeLabel, item: home },
        { "@type": "ListItem", position: 2, name: listLabel, item: list },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];
}

/** /blog: only the unfiltered first page is indexable. */
export function buildListMetadata(
  filters: { q: string; category: string; page: number },
  title: string,
  description: string,
): Metadata {
  const filtered = Boolean(filters.q || filters.category);
  const paged = filters.page > 1;
  const canonical = absoluteUrl(!filtered && paged ? `/blog?page=${filters.page}` : "/blog");
  return {
    title,
    description,
    ...(canonical && { alternates: { canonical } }),
    ...((filtered || paged) && { robots: { index: false, follow: true } }),
  };
}
