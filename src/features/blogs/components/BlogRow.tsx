import Link from "next/link";

import { BlogCover } from "@/features/blogs/components/BlogCover";
import type { BlogRowProps } from "@/features/blogs/types/blogs.types";
import { blogHref, formatBlogDate } from "@/features/blogs/utils/blogs.utils";

/** Compact mobile row: start-side thumbnail, category/date, title, excerpt. */
export function BlogRow({ post, locale }: BlogRowProps) {
  const isArabic = locale === "ar";
  return (
    <article className="relative flex min-w-0 gap-4 rounded-2xl border border-border/60 bg-card p-4 text-card-foreground shadow-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
      <BlogCover
        cover={post.cover}
        className="aspect-square w-24 shrink-0 rounded-xl sm:w-32"
      />
      <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
            {post.category.label}
          </span>
          <time dateTime={post.first_published_at}>
            {formatBlogDate(post.first_published_at, locale)}
          </time>
        </p>
        <h4
          className={`mt-2 text-base font-normal text-foreground ${
            isArabic
              ? "[font-family:var(--font-noto-arabic),sans-serif] leading-[1.5]"
              : "font-hero-display leading-snug"
          }`}
        >
          <Link
            href={blogHref(post.slug)}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {post.title}
          </Link>
        </h4>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
      </div>
    </article>
  );
}
