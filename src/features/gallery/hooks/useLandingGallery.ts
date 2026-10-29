"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { DEFAULT_PAGE_SIZE } from "../constants/gallery.constants";
import {
  fetchGalleryContent,
  fetchLandingGalleryCases,
} from "../services/gallery.service";
import type {
  GalleryCaptionContent,
  GalleryPublicCase,
  GalleryQueryParams,
  GallerySectionContent,
} from "../types/gallery.types";

/**
 * Stable query key factory for gallery queries.
 */
export const galleryKeys = {
  all: ["gallery"] as const,
  landing: (locale: string) => [...galleryKeys.all, "landing", locale] as const,
  list: (locale: string, params: GalleryQueryParams = {}) =>
    [
      ...galleryKeys.all,
      "list",
      locale,
      {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        procedure_tag: params.procedure_tag || undefined,
        timeframe_badge: params.timeframe_badge || undefined,
      },
    ] as const,
};

export interface LandingGalleryData {
  cases: GalleryPublicCase[];
  content: GallerySectionContent | null;
  captions: Record<string, GalleryCaptionContent>;
}

export interface UseLandingGalleryOptions {
  initialCases?: GalleryPublicCase[];
  initialContent?: GallerySectionContent | null;
  initialCaptions?: Record<string, GalleryCaptionContent>;
}

export function landingGalleryQueryOptions(
  locale: string,
  initial?: UseLandingGalleryOptions,
) {
  const hasInitial = initial?.initialCases !== undefined;
  const isValidInitial =
    hasInitial &&
    (!initial.initialContent?.lang || initial.initialContent.lang === locale);

  const initialData: LandingGalleryData | undefined = isValidInitial
    ? {
        cases: initial.initialCases!,
        content: initial.initialContent ?? null,
        captions: initial.initialCaptions ?? {},
      }
    : undefined;

  return queryOptions({
    queryKey: galleryKeys.landing(locale),
    queryFn: async ({ signal }): Promise<LandingGalleryData> => {
      const cases = await fetchLandingGalleryCases(5, { signal });
      const caseIds = cases.map((c) => c.id);
      const contentData = await fetchGalleryContent(locale, caseIds, { signal });
      return {
        cases,
        content: contentData.section,
        captions: contentData.captions,
      };
    },
    staleTime: 60_000,
    initialData,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const landingGalleryQuery = landingGalleryQueryOptions;

export function useLandingGallery(
  locale: string,
  options: UseLandingGalleryOptions = {},
) {
  const query = useQuery(landingGalleryQueryOptions(locale, options));
  const { refetch } = query;

  const retry = useCallback(() => {
    return refetch({ throwOnError: false });
  }, [refetch]);

  return {
    cases: query.data?.cases ?? null,
    content: query.data?.content ?? null,
    captions: query.data?.captions ?? {},
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isError: query.isError,
    retry,
    refetch,
    data: query.data,
  };
}

