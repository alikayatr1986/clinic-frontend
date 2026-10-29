"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProcedures } from "@/features/procedures/hooks/useProcedures";
import { GalleryCard } from "./GalleryCard";
import { GalleryLightbox } from "./GalleryLightbox";
import {
  DEFAULT_PAGE_SIZE,
  TIMEFRAME_OPTIONS,
} from "../constants/gallery.constants";
import { useGalleryCases } from "../hooks/useGalleryCases";
import type {
  GalleryBrowserProps,
  GalleryPublicCase,
  GalleryQueryParams,
} from "../types/gallery.types";
import { formatGalleryEyebrow } from "../utils/gallery.utils";

export function GalleryBrowser({
  initialCases,
  initialTotal,
  initialPage = 1,
  initialCaptions,
  initialSectionContent,
}: GalleryBrowserProps) {
  const t = useTranslations("gallery");
  const locale = useLocale();
  const { procedures, error: catalogError, retry: retryCatalog } = useProcedures();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const containerRef = useRef<HTMLDivElement>(null);
  const procedureSelectId = useId();
  const timeframeSelectId = useId();
  const hasRecovered400 = useRef<boolean>(false);

  // Active query parameters parsed from URL
  const rawPage = searchParams.get("page");
  const rawProcedure = searchParams.get("procedure_tag") || "";
  const rawTimeframe = searchParams.get("timeframe_badge") || "";

  const parsedPage = rawPage ? parseInt(rawPage, 10) : initialPage;
  const isPageInvalid = isNaN(parsedPage) || parsedPage < 1;
  const isTimeInvalid =
    rawTimeframe !== "" &&
    !TIMEFRAME_OPTIONS.some((opt) => opt.value === rawTimeframe);

  const pageToQuery = isPageInvalid ? 1 : parsedPage;
  const currentProcedure = rawProcedure;
  const currentTimeframe = isTimeInvalid ? "" : rawTimeframe;

  const {
    cases,
    total,
    sectionContent,
    captions,
    isLoading,
    isError,
    error,
    retry,
    refetch,
  } = useGalleryCases(
    locale,
    {
      page: pageToQuery,
      page_size: DEFAULT_PAGE_SIZE,
      procedure_tag: currentProcedure,
      timeframe_badge: currentTimeframe,
    },
    {
      initialCases,
      initialTotal,
      initialPage,
      initialCaptions,
      initialSectionContent,
    },
  );

  const [recoveryNotice, setRecoveryNotice] = useState<boolean>(false);

  // Lightbox modal state
  const [lightboxCase, setLightboxCase] = useState<GalleryPublicCase | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));

  // Handle URL normalization and recovery
  useEffect(() => {
    // 1. Recover from backend 400 rejection (e.g. invalid procedure code)
    const errorStatus = (error as { status?: number })?.status;
    if (errorStatus === 400) {
      if (!hasRecovered400.current) {
        hasRecovered400.current = true;
        setTimeout(() => {
          setRecoveryNotice(true);
        }, 0);
        router.replace(pathname);
        if (!rawProcedure && !rawTimeframe && (!rawPage || rawPage === "1")) {
          refetch();
        }
      }
      return;
    }

    if (!isError) {
      hasRecovered400.current = false;
    }

    // 2. Client-side invalid params (e.g. page < 1 or invalid timeframe)
    if (isPageInvalid || isTimeInvalid) {
      setTimeout(() => {
        setRecoveryNotice(true);
      }, 0);
      const cleanParams = new URLSearchParams();
      if (currentProcedure) cleanParams.set("procedure_tag", currentProcedure);
      if (currentTimeframe) cleanParams.set("timeframe_badge", currentTimeframe);
      const qs = cleanParams.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
      return;
    }

    // 3. Out-of-bounds page exceeding available pages (e.g. ?page=9999 with total 15)
    if (total > 0 && pageToQuery > totalPages) {
      setTimeout(() => {
        setRecoveryNotice(true);
      }, 0);
      const cleanParams = new URLSearchParams(searchParams.toString());
      cleanParams.delete("page");
      const qs = cleanParams.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }
  }, [
    error,
    isError,
    total,
    pageToQuery,
    totalPages,
    isPageInvalid,
    isTimeInvalid,
    rawProcedure,
    rawTimeframe,
    rawPage,
    currentProcedure,
    currentTimeframe,
    pathname,
    router,
    searchParams,
    refetch,
  ]);

  // Synchronize URL search params
  const updateQueryParams = useCallback(
    (newParams: Partial<GalleryQueryParams>) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newParams.procedure_tag !== undefined) {
        if (newParams.procedure_tag) {
          params.set("procedure_tag", newParams.procedure_tag);
        } else {
          params.delete("procedure_tag");
        }
      }

      if (newParams.timeframe_badge !== undefined) {
        if (newParams.timeframe_badge) {
          params.set("timeframe_badge", newParams.timeframe_badge);
        } else {
          params.delete("timeframe_badge");
        }
      }

      if (newParams.page !== undefined) {
        if (newParams.page > 1) {
          params.set("page", String(newParams.page));
        } else {
          params.delete("page");
        }
      }

      const qs = params.toString();
      const targetUrl = qs ? `${pathname}?${qs}` : pathname;
      router.push(targetUrl);
    },
    [pathname, router, searchParams],
  );

  // Handle filter changes (resets page to 1)
  const handleProcedureChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRecoveryNotice(false);
    updateQueryParams({
      procedure_tag: e.target.value,
      page: 1,
    });
  };

  const handleTimeframeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRecoveryNotice(false);
    updateQueryParams({
      timeframe_badge: e.target.value,
      page: 1,
    });
  };

  const handleResetFilters = () => {
    setRecoveryNotice(false);
    updateQueryParams({
      procedure_tag: "",
      timeframe_badge: "",
      page: 1,
    });
  };

  const handlePageChange = (newPage: number) => {
    setRecoveryNotice(false);
    updateQueryParams({ page: newPage });
    if (typeof containerRef.current?.scrollIntoView === "function") {
      containerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleEnlarge = (item: GalleryPublicCase) => {
    setLightboxCase(item);
    setIsLightboxOpen(true);
  };

  const hasActiveFilters = Boolean(currentProcedure) || Boolean(currentTimeframe);
  const errorStatus = (error as { status?: number })?.status;
  const hasError = isError && (errorStatus !== 400 || recoveryNotice);

  return (
    <div
      ref={containerRef}
      data-testid="gallery-browser"
      className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      {/* Gallery Header */}
      <div className="flex flex-col gap-2 mb-8 text-center sm:text-start">
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">
          {formatGalleryEyebrow(sectionContent?.eyebrow || t("eyebrow"))}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          {sectionContent?.heading || t("heading")}
        </h1>
        {(sectionContent?.introduction || t("introduction")) && (
          <p className="max-w-3xl text-base text-muted-foreground">
            {sectionContent?.introduction || t("introduction")}
          </p>
        )}
      </div>

      {/* Recovery Notice Banner */}
      {recoveryNotice && (
        <div
          role="status"
          aria-live="polite"
          data-testid="gallery-recovery-notice"
          className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200"
        >
          {t("recoveryNotice")}
        </div>
      )}

      {/* Filter and Count Bar */}
      <div className="mb-8 flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          {/* Procedure Filter */}
          <div className="flex items-center gap-2">
            <label
              htmlFor={procedureSelectId}
              className="sr-only sm:not-sr-only text-sm font-medium text-foreground whitespace-nowrap"
            >
              {t("filterProcedure")}
            </label>
            <select
              id={procedureSelectId}
              aria-label={t("filterProcedure")}
              value={currentProcedure}
              onChange={handleProcedureChange}
              className="h-12 min-h-12 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{t("allProcedures")}</option>
              {procedures.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {locale === "ar" ? opt.ar : opt.en}
                </option>
              ))}
            </select>
            {catalogError && (
              <div role="alert">
                <p>{t("procedureCatalogError")}</p>
                <Button type="button" variant="outline" onClick={retryCatalog}>
                  {t("retry")}
                </Button>
              </div>
            )}
          </div>

          {/* Timeframe Filter */}
          <div className="flex items-center gap-2">
            <label
              htmlFor={timeframeSelectId}
              className="sr-only sm:not-sr-only text-sm font-medium text-foreground whitespace-nowrap"
            >
              {t("filterTimeframe")}
            </label>
            <select
              id={timeframeSelectId}
              aria-label={t("filterTimeframe")}
              value={currentTimeframe}
              onChange={handleTimeframeChange}
              className="h-12 min-h-12 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{t("allTimeframes")}</option>
              {TIMEFRAME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey as never)}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Action */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="default"
              onClick={handleResetFilters}
              aria-label={t("resetFilters")}
            >
              <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
              <span>{t("resetFilters")}</span>
            </Button>
          )}
        </div>

        {/* Result Count and Live Region */}
        <div className="flex items-center sm:justify-end">
          <p
            data-testid="gallery-results-count"
            className="text-sm font-medium text-muted-foreground"
          >
            {total === 1
              ? t("resultCountOne")
              : t("resultCountOther", { count: total })}
          </p>
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {total === 0
              ? t("noResultsAnnouncement")
              : t("resultsCountAnnouncement", { count: total })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div
          data-testid="gallery-loading"
          className="py-16 text-center text-muted-foreground"
        >
          {t("loading")}
        </div>
      ) : hasError ? (
        <div
          role="alert"
          data-testid="gallery-error"
          className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center"
        >
          <h2 className="text-lg font-semibold text-foreground">
            {t("errorTitle")}
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {t("errorDescription")}
          </p>
          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={retry}
            >
              {t("retry")}
            </Button>
          </div>
        </div>
      ) : cases && cases.length === 0 ? (
        <div
          data-testid="gallery-empty"
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center"
        >
          <h2 className="text-xl font-semibold text-foreground">
            {hasActiveFilters ? t("noResultsTitle") : t("emptyTitle")}
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {hasActiveFilters
              ? t("noResultsDescription")
              : t("emptyDescription")}
          </p>
          {hasActiveFilters && (
            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleResetFilters}
              >
                <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
                <span>{t("resetFilters")}</span>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Responsive Case Grid */}
          <div
            data-testid="gallery-grid"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {cases?.map((c, idx) => (
              <GalleryCard
                key={c.id}
                item={c}
                caption={captions[c.id]}
                onEnlarge={handleEnlarge}
                priority={idx < 3}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <nav
              aria-label={t("pagination")}
              data-testid="gallery-pagination"
              className="mt-12 flex items-center justify-center gap-2"
            >
              <Button
                type="button"
                variant="outline"
                size="default"
                disabled={pageToQuery <= 1}
                onClick={() => handlePageChange(pageToQuery - 1)}
                aria-label={t("previousPage")}
              >
                <ChevronLeft
                  className="size-4 shrink-0 rtl:rotate-180"
                  aria-hidden="true"
                />
                <span>{t("previousPage")}</span>
              </Button>

              <span className="px-4 text-sm font-medium text-muted-foreground">
                {t("pageIndicator", {
                  page: pageToQuery,
                  totalPages,
                })}
              </span>

              <Button
                type="button"
                variant="outline"
                size="default"
                disabled={pageToQuery >= totalPages}
                onClick={() => handlePageChange(pageToQuery + 1)}
                aria-label={t("nextPage")}
              >
                <span>{t("nextPage")}</span>
                <ChevronRight
                  className="size-4 shrink-0 rtl:rotate-180"
                  aria-hidden="true"
                />
              </Button>
            </nav>
          )}
        </>
      )}

      {/* Lightbox Dialog */}
      <GalleryLightbox
        item={lightboxCase}
        caption={lightboxCase ? captions[lightboxCase.id] : undefined}
        open={isLightboxOpen}
        onOpenChange={setIsLightboxOpen}
      />
    </div>
  );
}
