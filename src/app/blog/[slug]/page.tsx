import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { BlogArticle } from "@/features/blogs/components/BlogArticle";
import {
  BLOG_CTA_HREF,
  BLOG_NAV_ITEMS,
} from "@/features/blogs/constants/blogs.constants";
import { fetchBlogDetail } from "@/features/blogs/services/blogs.service";
import type { BlogSlugPageProps } from "@/features/blogs/types/blogs.types";
import {
  buildArticleJsonLd,
  buildArticleMetadata,
  serializeJsonLd,
} from "@/features/blogs/utils/blogs-metadata.utils";

// Deduplicates the fetch between metadata and page within one request.
const loadPost = cache(async (slug: string) =>
  fetchBlogDetail(slug, await getLocale()),
);

export async function generateMetadata({ params }: BlogSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return {};
  return buildArticleMetadata(post);
}

export default async function BlogArticlePage({ params }: BlogSlugPageProps) {
  const { slug } = await params;
  // Awaited outside Suspense so a missing article is a real 404 status;
  // an API outage throws to error.tsx (retryable) instead.
  const post = await loadPost(slug);
  if (!post) notFound();
  const t = await getTranslations("blogs");
  const jsonLd = buildArticleJsonLd(post, t("breadcrumbHome"), t("breadcrumbArticles"));

  return (
    <>
      <SiteHeader items={BLOG_NAV_ITEMS} ctaHref={BLOG_CTA_HREF} activePath="/blog" />
      <main id="main-content" className="flex-1 pt-24 pb-16 lg:pt-32">
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
          />
        )}
        <BlogArticle post={post} />
      </main>
    </>
  );
}
