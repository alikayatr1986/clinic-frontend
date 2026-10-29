"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, ShieldCheck, Star, UserRound } from "lucide-react";
import { GalleryComparison } from "@/features/gallery/components/GalleryComparison";
import { useLandingGallery } from "@/features/gallery/hooks/useLandingGallery";
import type { GalleryStatistic } from "@/features/gallery/types/gallery.types";
import { formatGalleryEyebrow } from "@/features/gallery/utils/gallery.utils";
import type { GallerySectionProps } from "@/features/landing/types/landing.types";

export function GallerySection({
  initialCases,
  initialContent,
  initialCaptions,
}: GallerySectionProps) {
  const t = useTranslations("gallery");
  const locale = useLocale();
  const isArabic = locale === "ar";

  const {
    cases,
    content,
    captions,
    isLoading,
    isError: hasError,
    retry,
  } = useLandingGallery(locale, {
    initialCases,
    initialContent,
    initialCaptions,
  });

  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const activeIndex = cases && selectedIndex < cases.length ? selectedIndex : 0;
  const activeCase = cases ? cases[activeIndex] ?? null : null;

  const eyebrow = formatGalleryEyebrow(content?.eyebrow || t("eyebrow"));
  const heading = content?.heading || t("heading");
  const introduction = content?.introduction || t("introduction");
  const statistics: GalleryStatistic[] = content?.statistics || [];

  // Icon mapping for approved trust statistics
  const statIcons = [UserRound, Star, ShieldCheck];

  return (
    <section
      id="gallery"
      aria-labelledby="gallery-heading"
      lang={locale}
      dir={isArabic ? "rtl" : "ltr"}
      className="relative isolate scroll-mt-16 overflow-x-clip bg-background py-16 text-foreground lg:scroll-mt-20 lg:py-12"
    >
      <div className="relative mx-auto max-w-7xl min-w-0 px-4 sm:px-6 lg:px-8">
        {/* Error State */}
        {hasError ? (
          <div
            role="alert"
            className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {eyebrow}
            </p>
            <h2 id="gallery-heading" className="mt-2 text-2xl font-bold">
              {t("errorTitle")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("errorDescription")}</p>
            <div className="mt-6">
              <Button type="button" onClick={retry}>
                {t("retry")}
              </Button>
            </div>
          </div>
        ) : isLoading ? (
          /* Loading Skeleton State */
          <div
            data-testid="gallery-loading"
            role="status"
            className="animate-pulse space-y-6"
          >
            <span className="sr-only">{t("loading")}</span>
            <div className="h-4 w-32 rounded bg-muted"></div>
            <div className="h-10 w-3/4 max-w-md rounded bg-muted"></div>
            <div className="h-20 w-full max-w-xl rounded bg-muted"></div>
            <div className="aspect-[1.5/1] w-full rounded-2xl bg-muted"></div>
          </div>
        ) : !cases || cases.length === 0 ? (
          /* Empty State (0 Cases) */
          <div
            data-testid="gallery-empty"
            className="rounded-2xl border border-border/80 bg-card p-8 text-center sm:p-12"
          >
            <p className="text-xs font-semibold text-muted-foreground">
              {eyebrow}
            </p>
            <h2
              id="gallery-heading"
              className={`mt-4 text-balance text-2xl sm:text-3xl font-normal ${
                isArabic
                  ? "[font-family:var(--font-noto-arabic),sans-serif]"
                  : "font-hero-display"
              }`}
            >
              {heading}
            </h2>
            <p className="mt-4 max-w-lg mx-auto text-base text-muted-foreground">
              {t("emptyDescription")}
            </p>
          </div>
        ) : (
          /* Populated State (1 to 5 cases) */
          <div>
            {/* Top Area: Desktop Two-Column, Mobile Stacked */}
            <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-14">
              {/* Copy Column */}
              <div className="min-w-0 [overflow-wrap:anywhere]">
                <p
                  className={`flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground before:h-px before:w-10 before:shrink-0 before:bg-primary before:content-[''] ${
                    isArabic ? "tracking-normal" : "tracking-[.18em]"
                  }`}
                >
                  {eyebrow}
                </p>
                <h2
                  id="gallery-heading"
                  className={`mt-4 text-balance text-[clamp(2.25rem,5.5vw,3.5rem)] font-normal ${
                    isArabic
                      ? "[font-family:var(--font-noto-arabic),sans-serif] leading-[1.38]"
                      : "font-hero-display leading-[1.1]"
                  }`}
                >
                  {heading}
                </h2>
                {introduction && (
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {introduction}
                  </p>
                )}

                {/* Mobile Statistics Row (<1024px) */}
                {statistics.length > 0 && (
                  <div
                    data-testid="gallery-statistics-mobile"
                    className="mt-8 grid grid-cols-3 gap-3 border-y border-border/70 py-6 lg:hidden"
                  >
                    {statistics.map((stat, idx) => {
                      const Icon = statIcons[idx % statIcons.length];
                      return (
                        <div key={stat.key || idx} className="flex flex-col items-center text-center">
                          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                            <Icon className="size-5" aria-hidden="true" />
                          </div>
                          <p
                            dir="ltr"
                            className="text-lg font-bold tracking-tight text-foreground"
                          >
                            {stat.value}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                            {stat.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Approved Statistics Row (Desktop inline) */}
                {statistics.length > 0 && (
                  <div
                    data-testid="gallery-statistics"
                    className="mt-8 hidden lg:grid grid-cols-3 gap-6 border-y border-border/70 py-6"
                  >
                    {statistics.map((stat, idx) => {
                      const Icon = statIcons[idx % statIcons.length];
                      return (
                        <div key={stat.key || idx} className="flex items-center gap-3.5">
                          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="size-5" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <p
                              dir="ltr"
                              className="text-xl font-bold tracking-tight text-foreground"
                            >
                              {stat.value}
                            </p>
                            <p className="text-xs text-muted-foreground leading-snug">
                              {stat.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Large Featured Comparison Column */}
              <div className="min-w-0">
                {activeCase && (
                  <div className="space-y-4">
                    <GalleryComparison
                      item={activeCase}
                      caption={captions[activeCase.id]}
                      priority={true}
                      className="lg:mx-auto lg:max-w-[420px] lg:[&_img]:h-[320px] lg:[&_img]:max-h-[320px] lg:[&_img]:object-cover"
                    />

                    {/* Pagination Dots (Only shown if > 1 case) */}
                    {cases.length > 1 && (
                      <div
                        role="group"
                        aria-label={t("dotsLabel")}
                        className="flex items-center justify-center gap-2 pt-2"
                      >
                        {cases.map((c, idx) => {
                          const isSelected = idx === activeIndex;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setSelectedIndex(idx)}
                              aria-label={t("caseDot", { number: idx + 1 })}
                              aria-pressed={isSelected}
                              className="group flex min-h-[48px] min-w-[48px] items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            >
                              <span
                                className={`block rounded-full transition-all duration-200 ${
                                  isSelected
                                    ? "size-3 bg-primary ring-2 ring-primary/40 ring-offset-2"
                                    : "size-2.5 bg-muted-foreground/40 group-hover:bg-muted-foreground/70"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Supporting Cases Grid (Cases excluding selected case, up to 4) */}
            {cases && cases.length > 1 && (
              <div className="mt-6 lg:mt-12">
                <div
                  aria-label={t("supportingCases")}
                  className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
                >
                  {cases
                    .map((item, originalIndex) => ({ item, originalIndex }))
                    .filter(({ originalIndex }) => originalIndex !== activeIndex)
                    .slice(0, 4)
                    .map(({ item, originalIndex }) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedIndex(originalIndex)}
                        aria-label={t("caseThumbnail", { number: originalIndex + 1 })}
                        className="group relative block min-h-[48px] w-full overflow-hidden rounded-2xl border border-border/70 bg-card p-1.5 text-start transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        <GalleryComparison
                          item={item}
                          caption={captions[item.id]}
                          variant="thumbnail"
                        />
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* View Gallery CTA */}
            <div className="mt-10 grid sm:flex sm:justify-center lg:mt-14">
              <Button asChild size="lg">
                <Link href="/gallery">
                  <span>{t("cta")}</span>
                  <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
