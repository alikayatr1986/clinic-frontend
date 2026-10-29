import type { BlogBlock } from "@/features/blogs/types/blogs.types";
import { BLOG_QUERY_MAX_LENGTH } from "@/features/blogs/constants/blogs.constants";

/** Stable UTC calendar date so timezones never shift the printed day. */
export function formatBlogDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export interface BlogFilters {
  q: string;
  category: string;
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

/** Normalizes untrusted URL params to safe values; unknown categories are dropped. */
export function parseBlogFilters(
  raw: RawParams,
  categoryKeys: readonly string[],
): BlogFilters {
  const q = first(raw.q).replace(/\s+/g, " ").trim().slice(0, BLOG_QUERY_MAX_LENGTH);
  const cat = first(raw.category);
  const n = Number(first(raw.page));
  return {
    q,
    category: categoryKeys.includes(cat) ? cat : "",
    page: Number.isInteger(n) && n >= 1 && n <= 10000 ? n : 1,
  };
}

export function blogListHref(f: Partial<BlogFilters>): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.category) p.set("category", f.category);
  if (f.page && f.page > 1) p.set("page", String(f.page));
  const qs = p.toString();
  return qs ? `/blog?${qs}` : "/blog";
}

/** Mirrors the API rule: https URLs without credentials, or same-site root paths. */
export function safeBlogHref(href: string | undefined): string | null {
  if (!href) return null;
  if (href.startsWith("/")) {
    return href.startsWith("//") || href.includes("\\") ? null : href;
  }
  try {
    const u = new URL(href);
    return u.protocol === "https:" && !u.username && !u.password ? u.href : null;
  } catch {
    return null;
  }
}

export interface BlogTocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/** Unique, prefixed ids per heading block index (never collide with page ids). */
export function buildBlogAnchors(blocks: readonly BlogBlock[]): {
  ids: Map<number, string>;
  toc: BlogTocItem[];
} {
  const ids = new Map<number, string>();
  const toc: BlogTocItem[] = [];
  const used = new Set<string>();
  blocks.forEach((b, i) => {
    if (b.type !== "heading" || !b.text) return;
    const base =
      (b.anchor ?? "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}_-]+/gu, "-")
        .replace(/^-+|-+$/g, "") || `${i + 1}`;
    let id = `section-${base}`;
    for (let n = 2; used.has(id); n++) id = `section-${base}-${n}`;
    used.add(id);
    ids.set(i, id);
    toc.push({ id, text: b.text, level: b.level === 3 ? 3 : 2 });
  });
  return { ids, toc };
}

export function blogHref(slug: string): string {
  return `/blog/${encodeURIComponent(slug)}`;
}
