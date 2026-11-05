"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchGalleryOptions } from "../services/gallery.service";
import type { UseGalleryOptionsResult } from "../types/gallery.types";

export const galleryOptionsKeys = {
  all: ["gallery", "options"] as const,
};

export function galleryOptionsQueryOptions() {
  return queryOptions({
    queryKey: galleryOptionsKeys.all,
    queryFn: ({ signal }) => fetchGalleryOptions({ signal }),
    staleTime: 60_000,
  });
}

export function useGalleryOptions(): UseGalleryOptionsResult {
  const query = useQuery(galleryOptionsQueryOptions());
  const { refetch } = query;

  const retry = useCallback(() => {
    return refetch({ throwOnError: false });
  }, [refetch]);

  const data = query.data?.data;

  return {
    procedures: data?.procedures ?? [],
    timeframes: data?.timeframes ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    retry,
    refetch,
  };
}

