"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchBlogHome } from "@/features/blogs/services/blogs.service";
import type { BlogHome } from "@/features/blogs/types/blogs.types";

export const blogKeys = {
  all: ["blogs"] as const,
  home: (locale: string) => [...blogKeys.all, "home", locale] as const,
};

function matchesLocale(home: BlogHome, locale: string): boolean {
  if (home.featured?.lang && home.featured.lang !== locale) {
    return false;
  }
  if (
    home.articles.length > 0 &&
    home.articles.some((a) => a.lang !== locale)
  ) {
    return false;
  }
  return true;
}

export function blogHomeQueryOptions(locale: string, initialData?: BlogHome) {
  const initial =
    initialData && matchesLocale(initialData, locale) ? initialData : undefined;
  return queryOptions({
    queryKey: blogKeys.home(locale),
    queryFn: ({ signal }) => fetchBlogHome(locale, { signal }),
    staleTime: 60_000,
    initialData: initial,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const blogHomeQuery = blogHomeQueryOptions;

export interface UseBlogHomeOptions {
  initialHome?: BlogHome;
}

export function useBlogHome(
  locale: string,
  options: UseBlogHomeOptions = {},
) {
  const query = useQuery(blogHomeQueryOptions(locale, options.initialHome));
  const { refetch } = query;

  const retry = useCallback(() => {
    return refetch({ throwOnError: false });
  }, [refetch]);

  return {
    home: query.data ?? null,
    error: query.isError,
    retry,
    isLoading: query.isLoading,
  };
}
