"use client";

import { useTranslations } from "next-intl";

import type { BlogErrorProps } from "@/features/blogs/types/blogs.types";

// reset() re-renders the segment at the same URL, so the entered query is kept.
export default function BlogError({ reset }: BlogErrorProps) {
  const t = useTranslations("blogs");
  return (
    <main id="main-content" className="flex-1 px-4 pt-32 pb-16">
      <div
        role="alert"
        className="mx-auto max-w-xl rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center"
      >
        <h1 className="text-xl font-bold">{t("errorTitle")}</h1>
        <p className="mt-3 text-muted-foreground">{t("errorDescription")}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {t("retry")}
        </button>
      </div>
    </main>
  );
}
