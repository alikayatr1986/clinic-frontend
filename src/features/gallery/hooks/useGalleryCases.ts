"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { DEFAULT_PAGE_SIZE } from "../constants/gallery.constants";
import {
  fetchGalleryCases,
  fetchGalleryContent,
} from "../services/gallery.service";
import type {
  GalleryCaptionContent,
  GalleryPublicCase,
  GalleryQueryParams,
  GallerySectionContent,
} from "../types/gallery.types";
import { galleryKeys } from "./useLandingGallery";

export { galleryKeys };

export interface GalleryCasesData {
  cases: GalleryPublicCase[];
  total: number;
  page: number;
  pageSize: number;
  section: GallerySectionContent | null;
  captions: Record<string, GalleryCaptionContent>;
}

export interface UseGalleryCasesOptions {
  initialCases?: GalleryPublicCase[];
  initialTotal?: number;
  initialPage?: number;
  initialCaptions?: Record<string, GalleryCaptionContent>;
  initialSectionContent?: GallerySectionContent | null;
  enabled?: boolean;
}

export function galleryCasesQueryOptions(
  locale: string,
  params: GalleryQueryParams = {},
  options?: UseGalleryCasesOptions,
) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize =
    params.page_size && params.page_size > 0
      ? params.page_size
      : DEFAULT_PAGE_SIZE;
  const procedureTag = params.procedure_tag || "";
  const timeframeBadge = params.timeframe_badge || "";

  const hasInitial = options?.initialCases !== undefined;
  const isMatchingParams =
    page === (options?.initialPage ?? 1) &&
    !procedureTag &&
    !timeframeBadge;
  const isValidInitial =
    hasInitial &&
    isMatchingParams &&
    (!options?.initialSectionContent?.lang ||
      options.initialSectionContent.lang === locale);

  const initialData: GalleryCasesData | undefined = isValidInitial
    ? {
        cases: options.initialCases!,
        total: options.initialTotal ?? options.initialCases!.length,
        page: options.initialPage ?? 1,
        pageSize,
        section: options.initialSectionContent ?? null,
        captions: options.initialCaptions ?? {},
      }
    : undefined;

  return queryOptions({
    queryKey: galleryKeys.list(locale, {
      page,
      page_size: pageSize,
      procedure_tag: procedureTag,
      timeframe_badge: timeframeBadge,
    }),
    queryFn: async ({ signal }): Promise<GalleryCasesData> => {
      const listRes = await fetchGalleryCases(
        {
          page,
          page_size: pageSize,
          procedure_tag: procedureTag,
          timeframe_badge: timeframeBadge,
        },
        { signal },
      );

      const caseIds = (listRes.data ?? []).map((c) => c.id);
      const contentData = await fetchGalleryContent(locale, caseIds, { signal });

      return {
        cases: listRes.data ?? [],
        total: listRes.total ?? 0,
        page: listRes.page ?? page,
        pageSize: listRes.page_size ?? pageSize,
        section: contentData.section,
        captions: contentData.captions,
      };
    },
    staleTime: 60_000,
    initialData,
    enabled: options?.enabled ?? true,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const galleryCasesQuery = galleryCasesQueryOptions;

export function useGalleryCases(
  locale: string,
  params: GalleryQueryParams = {},
  options: UseGalleryCasesOptions = {},
) {
  const query = useQuery(galleryCasesQueryOptions(locale, params, options));
  const { refetch } = query;

  const retry = useCallback(() => {
    return refetch({ throwOnError: false });
  }, [refetch]);

  return {
    cases: query.data?.cases ?? null,
    total: query.data?.total ?? 0,
    page: query.data?.page ?? (params.page ?? 1),
    pageSize: query.data?.pageSize ?? DEFAULT_PAGE_SIZE,
    sectionContent: query.data?.section ?? null,
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

