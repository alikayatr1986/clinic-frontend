import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";

import { BlogCard } from "@/features/blogs/components/BlogCard";
import { BLOG_PAGE_SIZE } from "@/features/blogs/constants/blogs.constants";
import {
  fetchBlogCategories,
  fetchBlogList,
} from "@/features/blogs/services/blogs.service";
import type { BlogListProps } from "@/features/blogs/types/blogs.types";
import { blogListHref, parseBlogFilters } from "@/features/blogs/utils/blogs.utils";
import { cn } from "@/lib/utils";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

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
        <Button type="submit">
          <Search className="size-4" aria-hidden="true" />
          {t("searchButton")}
        </Button>
      </form>

      <nav aria-label={t("categoriesLabel")} className="mt-6">
        <ul className="flex flex-wrap gap-3">
          {[{ key: "", label: t("allCategories") }, ...categories].map((c) => {
            const active = c.key === filters.category;
            return (
              <li key={c.key || "all"}>
                <Button asChild variant={active ? "default" : "outline"}>
                  <Link
                    href={blogListHref({ q: filters.q, category: c.key })}
                    aria-current={active ? "true" : undefined}
                  >
                    {c.label}
                  </Link>
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      <p role="status" aria-live="polite" className="mt-6 text-sm text-muted-foreground">
        {outOfRange ? t("outOfRange", { page: filters.page }) : t("resultCount", { count: total })}
      </p>

      {outOfRange ? (
        <div className="mt-4">
          <Button asChild variant="link">
            <Link href={blogListHref({ ...filters, page: 1 })}>{t("backToFirstPage")}</Link>
          </Button>
        </div>
      ) : data.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border/80 bg-card p-8 text-center sm:p-12">
          <h2 className="text-xl font-bold">
            {hasFilters ? t("noResultsTitle") : t("empty")}
          </h2>
          {hasFilters && (
            <>
              <p className="mt-3 text-muted-foreground">{t("noResultsDescription")}</p>
              <div className="mt-6">
                <Button asChild><Link href="/blog">{t("clearFilters")}</Link></Button>
              </div>
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
            <Button asChild variant="outline">
              <Link
                href={blogListHref({ ...filters, page: filters.page - 1 })}
                rel="prev"
              >
                <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
                {t("previousPage")}
              </Link>
            </Button>
          ) : (
            <span />
          )}
          <span aria-current="page" className="text-sm text-muted-foreground">
            {t("pageOf", { page: filters.page, total: totalPages })}
          </span>
          {filters.page < totalPages ? (
            <Button asChild variant="outline">
              <Link
                href={blogListHref({ ...filters, page: filters.page + 1 })}
                rel="next"
              >
                {t("nextPage")}
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
