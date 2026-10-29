import type {
  BlogCategory,
  BlogDetail,
  BlogHome,
  BlogList,
  BlogListQuery,
} from "../types/blogs.types";

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8080"
  );
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Blog API returned status ${res.status}`);
  }
  return res.json();
}

export async function fetchBlogCategories(lang: string): Promise<BlogCategory[]> {
  const json = await getJson<{ data?: BlogCategory[] }>(
    `/api/v1/blogs/categories?lang=${encodeURIComponent(lang)}`,
  );
  return json.data ?? [];
}

export async function fetchBlogList(q: BlogListQuery): Promise<BlogList> {
  const params = new URLSearchParams({
    lang: q.lang,
    page: String(q.page),
    page_size: String(q.pageSize),
  });
  if (q.category) params.set("category", q.category);
  if (q.q) params.set("q", q.q);
  const json = await getJson<Partial<BlogList>>(`/api/v1/blogs?${params}`);
  return { data: json.data ?? [], total: json.total ?? 0 };
}

const SITEMAP_PAGE_SIZE = 500;

/** Every live slug; throws rather than emitting a partial sitemap. */
export async function fetchBlogSitemap(): Promise<
  { slug: string; last_published_at: string }[]
> {
  const all: { slug: string; last_published_at: string }[] = [];
  for (let page = 1; ; page++) {
    const json = await getJson<{
      data?: { slug: string; last_published_at: string }[];
      total?: number;
    }>(`/api/v1/blogs/sitemap?page=${page}&page_size=${SITEMAP_PAGE_SIZE}`);
    const data = json.data ?? [];
    all.push(...data);
    if (data.length === 0 || all.length >= (json.total ?? 0)) return all;
  }
}

/** Returns null only for a real 404; any other failure throws (retryable). */
export async function fetchBlogDetail(
  slug: string,
  lang: string,
): Promise<BlogDetail | null> {
  const res = await fetch(
    `${getBaseUrl()}/api/v1/blogs/${encodeURIComponent(slug)}?lang=${encodeURIComponent(lang)}`,
    { cache: "no-store", headers: { Accept: "application/json" } },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Blog API returned status ${res.status}`);
  }
  const json: { data: BlogDetail } = await res.json();
  return json.data;
}

/** Throws on any failure so callers can tell "unavailable" from "empty". */
export async function fetchBlogHome(lang: string): Promise<BlogHome> {
  const res = await fetch(
    `${getBaseUrl()}/api/v1/blogs/home?lang=${encodeURIComponent(lang)}`,
    { cache: "no-store", headers: { Accept: "application/json" } },
  );
  if (!res.ok) {
    throw new Error(`Blog API returned status ${res.status}`);
  }
  const json: { data?: Partial<BlogHome> } = await res.json();
  return {
    featured: json.data?.featured ?? null,
    articles: json.data?.articles ?? [],
  };
}
