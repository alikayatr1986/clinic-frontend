import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BlogCover } from "@/features/blogs/components/BlogCover";
import type { BlogCardProps } from "@/features/blogs/types/blogs.types";
import { blogHref, formatBlogDate } from "@/features/blogs/utils/blogs.utils";
import { cn } from "@/lib/utils";

export function BlogCard({
  post,
  locale,
  readMoreLabel,
  coverClassName = "aspect-[4/3]",
  showReadMore = true,
  className,
  headingLevel: Heading = "h3",
}: BlogCardProps) {
  const isArabic = locale === "ar";
  return (
    <article
      className={cn(
        "group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary",
        className,
      )}
    >
      <BlogCover cover={post.cover} className={cn("w-full shrink-0", coverClassName)} />
      <div className="flex flex-1 flex-col gap-3 p-5 [overflow-wrap:anywhere]">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
            {post.category.label}
          </span>
          <time dateTime={post.first_published_at}>
            {formatBlogDate(post.first_published_at, locale)}
          </time>
        </p>
        <Heading
          className={cn(
            "text-xl font-normal text-foreground",
            isArabic
              ? "[font-family:var(--font-noto-arabic),sans-serif] leading-[1.5]"
              : "font-hero-display leading-snug",
          )}
        >
          <Link
            href={blogHref(post.slug)}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {post.title}
          </Link>
        </Heading>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>
        {showReadMore && (
          <span
            aria-hidden="true"
            className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-primary"
          >
            {readMoreLabel}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </span>
        )}
      </div>
    </article>
  );
}
