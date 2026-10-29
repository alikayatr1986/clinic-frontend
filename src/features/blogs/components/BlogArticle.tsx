import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { BlogBody } from "@/features/blogs/components/BlogBody";
import { BlogCard } from "@/features/blogs/components/BlogCard";
import { BlogCover } from "@/features/blogs/components/BlogCover";
import { BLOG_CTA_HREF } from "@/features/blogs/constants/blogs.constants";
import type { BlogDetail } from "@/features/blogs/types/blogs.types";
import {
  buildBlogAnchors,
  formatBlogDate,
  safeBlogHref,
} from "@/features/blogs/utils/blogs.utils";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function BlogArticle({ post }: { post: BlogDetail }) {
  const t = useTranslations("blogs");
  const locale = useLocale();
  const { toc } = buildBlogAnchors(post.body.blocks);
  const showToc = toc.length >= 3;
  const published = formatBlogDate(post.first_published_at, locale);
  const updated = formatBlogDate(post.last_published_at, locale);
  const references = post.references.filter((r) => {
      return safeBlogHref(r.url);
    });

  const tocList = (
    <ol className="space-y-2 text-sm">
      {toc.map((item) => (
        <li key={item.id} className={item.level === 3 ? "ps-4" : undefined}>
          <a href={`#${item.id}`} className={`text-primary underline-offset-4 hover:underline ${focusRing}`}>
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <article className="mx-auto max-w-7xl min-w-0 px-4 sm:px-6 lg:px-8">
      <nav aria-label={t("breadcrumbLabel")} className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className={`underline-offset-4 hover:underline ${focusRing}`}>
              {t("breadcrumbHome")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/blog" className={`underline-offset-4 hover:underline ${focusRing}`}>
              {t("breadcrumbArticles")}
            </Link>
          </li>
        </ol>
      </nav>

      <header className="mx-auto mt-6 max-w-3xl [overflow-wrap:anywhere]">
        <p className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {post.category.label}
        </p>
        <h1 className="mt-4 text-balance text-4xl font-normal leading-tight font-hero-display lg:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
        <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>{t("byAuthor", { name: post.author_name })}</span>
          {post.reviewer_attribution && (
            <span>{t("reviewedBy", { name: post.reviewer_attribution })}</span>
          )}
          <time dateTime={post.first_published_at}>{published}</time>
          {updated !== published && (
            <span>
              {t("updatedOn")} <time dateTime={post.last_published_at}>{updated}</time>
            </span>
          )}
          <span>{t("readingTime", { minutes: post.reading_time_minutes })}</span>
        </p>
      </header>

      {post.cover && (
        <BlogCover
          cover={post.cover}
          className="mx-auto mt-8 aspect-[2/1] max-w-5xl rounded-2xl"
        />
      )}

      <div className="mx-auto mt-10 grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0 lg:order-1">
          {showToc && (
            <details className="mb-8 rounded-xl border border-border bg-card p-4 lg:hidden">
              <summary className={`min-h-12 cursor-pointer font-semibold ${focusRing}`}>
                {t("contents")}
              </summary>
              <div className="mt-3">{tocList}</div>
            </details>
          )}
          <div className="mx-auto max-w-[70ch]">
            <BlogBody blocks={post.body.blocks} externalLabel={t("opensExternal")} />
          </div>

          {references.length > 0 && (
            <section aria-labelledby="blog-references" className="mx-auto mt-12 max-w-[70ch]">
              <h2 id="blog-references" className="text-xl font-bold">
                {t("references")}
              </h2>
              <ol className="mt-4 list-decimal space-y-2 ps-6 text-sm [overflow-wrap:anywhere]">
                {references.map((r, i) => (
                  <li key={i}>
                    <a
                      href={safeBlogHref(r.url) ?? undefined}
                      {...(r.url.startsWith("/") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                      className={`text-primary underline underline-offset-4 ${focusRing}`}
                    >
                      {r.label}
                      {!r.url.startsWith("/") && (
                        <span className="sr-only"> ({t("opensExternal")})</span>
                      )}
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <aside
            aria-label={t("noticeLabel")}
            className="mx-auto mt-12 max-w-[70ch] rounded-xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground"
          >
            <p>{t("notice")}</p>
            <a
              href={BLOG_CTA_HREF}
              className={`mt-3 inline-flex min-h-12 items-center gap-2 font-semibold text-primary ${focusRing}`}
            >
              {t("consultation")}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </a>
          </aside>
        </div>

        {showToc && (
          <aside aria-label={t("contents")} className="hidden lg:order-2 lg:block">
            <div className="sticky top-28">
              <h2 className="mb-3 text-sm font-bold">{t("contents")}</h2>
              {tocList}
            </div>
          </aside>
        )}
      </div>

      {post.related_articles.length > 0 && (
        <section aria-labelledby="blog-related" className="mx-auto mt-16 max-w-7xl">
          <h2 id="blog-related" className="text-2xl font-bold">
            {t("related")}
          </h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {post.related_articles.slice(0, 3).map((r) => (
              <li key={r.id} className="min-w-0">
                <BlogCard post={r} locale={locale} readMoreLabel={t("readMore")} headingLevel="h3" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link
        href="/blog"
        className={`mt-12 inline-flex min-h-12 items-center gap-2 font-semibold text-primary ${focusRing}`}
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        {t("backToArticles")}
      </Link>
    </article>
  );
}
