import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";

import { BlogCard } from "@/features/blogs/components/BlogCard";
import { BLOG_PAGE_SIZE } from "@/features/blogs/constants/blogs.constants";
import {
  fetchBlogCategories,
  fetchBlogList,
} from "@/features/blogs/services/blogs.service";
import { blogListHref, parseBlogFilters } from "@/features/blogs/utils/blogs.utils";
import { cn } from "@/lib/utils";

interface BlogListProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const pill =
  "inline-flex min-h-12 items-center rounded-full border px-5 text-sm font-semibold transition-colors";

/**
 * Server-rendered so crawlers and refreshes get real headings and links.
 * URL (q, category, page) is the single source of state: forms and links are
 * plain navigations, so back/forward/refresh work without client state.
 * Failures throw to the route's error boundary; they are never shown as empty.
 */
export async function BlogList({ searchParams }: BlogListProps) {
  const [t, locale, raw] = await Promise.all([
    getTranslations("blogs"),
    getLocale(),
    searchParams,
  ]);
  const categories = await fetchBlogCategories(locale);
  const filters = parseBlogFilters(
    raw,
    categories.map((c) => c.key),
  );
  const { data, total } = await fetchBlogList({
    lang: locale,
    page: filters.page,
    pageSize: BLOG_PAGE_SIZE,
    category: filters.category || undefined,
    q: filters.q || undefined,
  });

  const totalPages = Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE));
  const hasFilters = Boolean(filters.q || filters.category);
  const outOfRange = data.length === 0 && total > 0 && filters.page !== 1;

  return (
    <div className="mx-auto max-w-7xl min-w-0 px-4 sm:px-6 lg:px-8">
      <nav aria-label={t("breadcrumbLabel")} className="text-sm text-muted-foreground">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className={cn("underline-offset-4 hover:underline", focusRing)}>
              {t("breadcrumbHome")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{t("breadcrumbArticles")}</li>
        </ol>
      </nav>

      <h1
        id="blog-results-heading"
        tabIndex={-1}
        className="mt-6 text-balance text-4xl font-normal text-foreground font-hero-display lg:text-5xl"
      >
        {t("listHeading")}
      </h1>
      <p className="mt-4 max-w-2xl text-base text-muted-foreground">{t("listIntro")}</p>

      <form action="/blog" method="get" role="search" className="mt-8 flex max-w-xl gap-3">
        {filters.category && <input type="hidden" name="category" value={filters.category} />}
        <label htmlFor="blog-search" className="sr-only">
          {t("searchLabel")}
        </label>
        <input
          id="blog-search"
          name="q"
          type="search"
          maxLength={120}
          defaultValue={filters.q}
          placeholder={t("searchLabel")}
          className={cn(
            "min-h-12 min-w-0 flex-1 rounded-xl border border-border bg-card px-4 text-sm text-foreground",
            focusRing,
          )}
        />
        <button
          type="submit"
          className={cn(
            "inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90",
            focusRing,
          )}
        >
          <Search className="size-4" aria-hidden="true" />
          {t("searchButton")}
        </button>
      </form>

      <nav aria-label={t("categoriesLabel")} className="mt-6">
        <ul className="flex flex-wrap gap-3">
          {[{ key: "", label: t("allCategories") }, ...categories].map((c) => {
            const active = c.key === filters.category;
            return (
              <li key={c.key || "all"}>
                <Link
                  href={blogListHref({ q: filters.q, category: c.key })}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    pill,
                    focusRing,
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-muted",
                  )}
                >
                  {c.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p role="status" aria-live="polite" className="mt-6 text-sm text-muted-foreground">
        {outOfRange ? t("outOfRange", { page: filters.page }) : t("resultCount", { count: total })}
      </p>

      {outOfRange ? (
        <Link
          href={blogListHref({ ...filters, page: 1 })}
          className={cn("mt-4 inline-flex min-h-12 items-center font-semibold text-primary", focusRing)}
        >
          {t("backToFirstPage")}
        </Link>
      ) : data.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border/80 bg-card p-8 text-center sm:p-12">
          <h2 className="text-xl font-bold">
            {hasFilters ? t("noResultsTitle") : t("empty")}
          </h2>
          {hasFilters && (
            <>
              <p className="mt-3 text-muted-foreground">{t("noResultsDescription")}</p>
              <Link
                href="/blog"
                className={cn(
                  "mt-6 inline-flex min-h-12 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground",
                  focusRing,
                )}
              >
                {t("clearFilters")}
              </Link>
            </>
          )}
        </div>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((post) => (
            <li key={post.id} className="min-w-0">
              <BlogCard
                              post={post}
                              locale={locale}
                              readMoreLabel={t("readMore")}
                              headingLevel="h2"
                            />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && !outOfRange && (
        <nav
          aria-label={t("pagination")}
          className="mt-10 flex items-center justify-between gap-4"
        >
          {filters.page > 1 ? (
            <Link
              href={blogListHref({ ...filters, page: filters.page - 1 })}
              rel="prev"
              className={cn(pill, focusRing, "gap-2 border-border bg-card")}
            >
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
              {t("previousPage")}
            </Link>
          ) : (
            <span />
          )}
          <span aria-current="page" className="text-sm text-muted-foreground">
            {t("pageOf", { page: filters.page, total: totalPages })}
          </span>
          {filters.page < totalPages ? (
            <Link
              href={blogListHref({ ...filters, page: filters.page + 1 })}
              rel="next"
              className={cn(pill, focusRing, "gap-2 border-border bg-card")}
            >
              {t("nextPage")}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
