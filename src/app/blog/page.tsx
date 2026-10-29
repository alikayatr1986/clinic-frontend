import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { BlogList } from "@/features/blogs/components/BlogList";
import {
  BLOG_CTA_HREF,
  BLOG_NAV_ITEMS,
} from "@/features/blogs/constants/blogs.constants";
import { buildListMetadata } from "@/features/blogs/utils/blogs-metadata.utils";
import { parseBlogFilters } from "@/features/blogs/utils/blogs.utils";
import BlogLoading from "./loading";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const t = await getTranslations("blogs");
  // Category validity is checked by the list; any category param is noindex here.
  const raw = await searchParams;
  const filters = parseBlogFilters(raw, [String(raw.category ?? "")]);
  return buildListMetadata(filters, t("pageTitle"), t("pageDescription"));
}

export default function BlogPage({ searchParams }: Props) {
  return (
    <>
      <SiteHeader items={BLOG_NAV_ITEMS} ctaHref={BLOG_CTA_HREF} activePath="/blog" />
      <main id="main-content" className="flex-1 pt-24 pb-16 lg:pt-32">
        <Suspense fallback={<BlogLoading />}>
          <BlogList searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}
