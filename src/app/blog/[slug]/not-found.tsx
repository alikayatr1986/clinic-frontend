import Link from "next/link";
import { useTranslations } from "next-intl";

import { SiteHeader } from "@/components/layout/SiteHeader";
import {
  BLOG_CTA_HREF,
  BLOG_NAV_ITEMS,
} from "@/features/blogs/constants/blogs.constants";

export default function BlogNotFound() {
  const t = useTranslations("blogs");
  return (
    <>
      <SiteHeader items={BLOG_NAV_ITEMS} ctaHref={BLOG_CTA_HREF} activePath="/blog" />
      <main id="main-content" className="flex-1 px-4 pt-32 pb-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-2xl font-bold">{t("notFoundTitle")}</h1>
          <p className="mt-3 text-muted-foreground">{t("notFoundDescription")}</p>
          <Link
            href="/blog"
            className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t("backToArticles")}
          </Link>
        </div>
      </main>
    </>
  );
}
