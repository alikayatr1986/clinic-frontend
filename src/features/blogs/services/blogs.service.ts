import { apiRequest, ApiError } from "@/lib/api";
import type {
  BlogCategory,
  BlogDetail,
  BlogHome,
  BlogList,
  BlogListQuery,
} from "../types/blogs.types";

export interface FetchBlogOptions {
  signal?: AbortSignal;
}

export async function fetchBlogCategories(
  lang: string,
  options: FetchBlogOptions = {},
): Promise<BlogCategory[]> {
  const json = await apiRequest<{ data?: BlogCategory[] }>(
    "/api/v1/blogs/categories",
    {
      query: { lang },
      signal: options.signal,
    },
  );
  return json?.data ?? [];
}

export async function fetchBlogList(
  q: BlogListQuery,
  options: FetchBlogOptions = {},
): Promise<BlogList> {
  const json = await apiRequest<Partial<BlogList>>("/api/v1/blogs", {
    query: {
      lang: q.lang,
      page: q.page,
      page_size: q.pageSize,
      category: q.category || undefined,
      q: q.q || undefined,
    },
    signal: options.signal,
  });
  return { data: json?.data ?? [], total: json?.total ?? 0 };
}

const SITEMAP_PAGE_SIZE = 500;

/** Every live slug; throws rather than emitting a partial sitemap. */
export async function fetchBlogSitemap(
  options: FetchBlogOptions = {},
): Promise<{ slug: string; last_published_at: string }[]> {
  const all: { slug: string; last_published_at: string }[] = [];
  for (let page = 1; ; page++) {
    const json = await apiRequest<{
      data?: { slug: string; last_published_at: string }[];
      total?: number;
    }>("/api/v1/blogs/sitemap", {
      query: { page, page_size: SITEMAP_PAGE_SIZE },
      signal: options.signal,
    });
    const data = json?.data ?? [];
    all.push(...data);
    if (data.length === 0 || all.length >= (json?.total ?? 0)) return all;
  }
}

/** Returns null only for a real 404; any other failure throws (retryable). */
export async function fetchBlogDetail(
  slug: string,
  lang: string,
  options: FetchBlogOptions = {},
): Promise<BlogDetail | null> {
  try {
    const json = await apiRequest<{ data: BlogDetail }>(
      `/api/v1/blogs/${encodeURIComponent(slug)}`,
      {
        query: { lang },
        signal: options.signal,
      },
    );
    return json.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/** Throws on any failure so callers can tell "unavailable" from "empty". */
export async function fetchBlogHome(
  lang: string,
  options: FetchBlogOptions = {},
): Promise<BlogHome> {
  const json = await apiRequest<{ data?: Partial<BlogHome> }>(
    "/api/v1/blogs/home",
    {
      query: { lang },
      signal: options.signal,
    },
  );
  return {
    featured: json?.data?.featured ?? null,
    articles: json?.data?.articles ?? [],
  };
}
