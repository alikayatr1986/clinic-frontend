"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { BlogCard } from "@/features/blogs/components/BlogCard";
import { BlogRow } from "@/features/blogs/components/BlogRow";
import { fetchBlogHome } from "@/features/blogs/services/blogs.service";
import type { BlogHome } from "@/features/blogs/types/blogs.types";

const PAGE_SIZE = 3;
const MAX_ARTICLES = 12;
const DESKTOP_QUERY = "(min-width: 1024px)";

const hasMatchMedia = () => typeof window.matchMedia === "function";

function subscribeDesktop(onChange: () => void) {
  if (!hasMatchMedia()) return () => {};
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

// One layout in the accessibility tree at a time (no duplicate links).
function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribeDesktop,
    () => hasMatchMedia() && window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

const navButtonClass =
  "inline-flex size-12 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-40";

export interface BlogsSectionProps {
  initialHome?: BlogHome;
}

export function BlogsSection({ initialHome }: BlogsSectionProps) {
  const t = useTranslations("blogs");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const isDesktop = useIsDesktop();

  const [home, setHome] = useState<BlogHome | null>(initialHome ?? null);
  const [hasError, setHasError] = useState(false);
  const [page, setPage] = useState(0);

  const loadData = useCallback(() => {
    setHasError(false);
    fetchBlogHome(locale)
      .then((data) => {
        setHome(data);
        setPage(0);
      })
      .catch(() => setHasError(true));
  }, [locale]);

  useEffect(() => {
    if (initialHome === undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount, mirrors GallerySection
      loadData();
    }
  }, [initialHome, loadData]);

  const articles = (home?.articles ?? []).slice(0, MAX_ARTICLES);
  const featured =
    (home?.featured && articles.find((a) => a.id === home.featured?.id)) ||
    articles[0] ||
    null;
  const latest = articles.filter((a) => a.id !== featured?.id).slice(0, PAGE_SIZE);

  const pageCount = Math.ceil(articles.length / PAGE_SIZE);
  // Clamp if a refresh shrank the set while a later page was active.
  const current = Math.min(page, Math.max(pageCount - 1, 0));
  const visible = articles.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const headingFont = isArabic
    ? "[font-family:var(--font-noto-arabic),sans-serif] leading-[1.38]"
    : "font-hero-display leading-[1.1]";

  return (
    <section
      id="blog"
      aria-labelledby="blog-heading"
      lang={locale}
      dir={isArabic ? "rtl" : "ltr"}
      className="relative isolate scroll-mt-16 overflow-x-clip border-y border-border/60 bg-secondary py-16 text-foreground lg:scroll-mt-20 lg:py-24"
    >
      <div className="mx-auto grid max-w-7xl min-w-0 gap-10 px-4 sm:px-6 lg:grid-cols-4 lg:gap-12 lg:px-8">
        <div className="min-w-0 lg:col-span-1">
          <p
            className={`flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground before:h-px before:w-10 before:shrink-0 before:bg-primary before:content-[''] ${
              isArabic ? "tracking-normal" : "tracking-[.18em]"
            }`}
          >
            {t("eyebrow")}
          </p>
          <h2
            id="blog-heading"
            className={`mt-4 text-balance text-[clamp(2rem,4.5vw,2.75rem)] font-normal ${headingFont}`}
          >
            {t("heading")}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            {t("introduction")}
          </p>
          <div className="mt-8 grid sm:block">
            <Button asChild>
              <Link href="/blog">
                <span>{t("viewAllArticles")}</span>
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="min-w-0 lg:col-span-3">
          {hasError ? (
            <div
              role="alert"
              className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center"
            >
              <h3 className="text-xl font-bold">{t("errorTitle")}</h3>
              <p className="mt-3 text-muted-foreground">{t("errorDescription")}</p>
              <div className="mt-6">
                <Button type="button" onClick={loadData}>
                  {t("retry")}
                </Button>
              </div>
            </div>
          ) : home === null ? (
            <div
              data-testid="blogs-loading"
              role="status"
              className="grid animate-pulse gap-6 lg:grid-cols-3"
            >
              <span className="sr-only">{t("loading")}</span>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`aspect-[4/5] rounded-2xl bg-muted ${i > 0 ? "hidden lg:block" : ""}`}
                />
              ))}
            </div>
          ) : !featured ? (
            <div
              data-testid="blogs-empty"
              className="rounded-2xl border border-border/80 bg-card p-8 text-center sm:p-12"
            >
              <p className="text-base text-muted-foreground">{t("empty")}</p>
            </div>
          ) : isDesktop ? (
            <div role="group" aria-label={t("carouselLabel")}>
              {pageCount > 1 && (
                <div className="mb-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className={navButtonClass}
                    aria-label={t("previous")}
                    disabled={current === 0}
                    onClick={() => setPage(current - 1)}
                  >
                    <ArrowLeft className="size-5 rtl:rotate-180" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={navButtonClass}
                    aria-label={t("next")}
                    disabled={current === pageCount - 1}
                    onClick={() => setPage(current + 1)}
                  >
                    <ArrowRight className="size-5 rtl:rotate-180" aria-hidden="true" />
                  </button>
                </div>
              )}
              <div className="grid grid-cols-3 items-stretch gap-6">
                {visible.map((post) => (
                  <BlogCard
                    key={post.id}
                    post={post}
                    locale={locale}
                    readMoreLabel={t("readMore")}
                  />
                ))}
              </div>
              {pageCount > 1 && (
                <>
                  <div aria-hidden="true" className="mt-8 flex justify-center gap-2">
                    {Array.from({ length: pageCount }, (_, i) => (
                      <span
                        key={i}
                        data-testid="blogs-indicator"
                        data-current={i === current}
                        className={`h-1.5 w-10 rounded-full ${
                          i === current ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <p role="status" aria-live="polite" className="sr-only">
                    {t("pageStatus", { page: current + 1, total: pageCount })}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="mx-auto max-w-2xl lg:max-w-none">
              <BlogCard
                post={featured}
                locale={locale}
                readMoreLabel={t("readMore")}
                coverClassName="aspect-[2.9/1]"
                showReadMore={false}
              />
              {latest.length > 0 && (
                <div className="mt-10">
                  <div className="flex items-center justify-between gap-4">
                    <h3
                      className={`text-xl font-normal ${
                        isArabic
                          ? "[font-family:var(--font-noto-arabic),sans-serif]"
                          : "font-hero-display"
                      }`}
                    >
                      {t("latest")}
                    </h3>
                    <Button asChild variant="link">
                      <Link href="/blog">{t("viewAll")}</Link>
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-4">
                    {latest.map((post) => (
                      <BlogRow key={post.id} post={post} locale={locale} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
