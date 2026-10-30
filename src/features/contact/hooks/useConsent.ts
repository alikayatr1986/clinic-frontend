"use client";

import { queryOptions, useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { fetchConsent } from '@/features/contact/services/contact.service';
import type { Consent } from '@/features/contact/types/contact.types';

export const contactKeys = {
  all: ['contact'] as const,
  consent: (locale: string) => [...contactKeys.all, 'consent', locale] as const,
};

export function consentQueryOptions(locale: string) {
  return queryOptions({
    queryKey: contactKeys.consent(locale),
    queryFn: ({ signal }) => fetchConsent(locale, { signal }),
    staleTime: Infinity,
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useConsent(locale: string) {
  const query = useQuery(consentQueryOptions(locale));
  const { refetch } = query;

  const retry = useCallback(() => {
    return refetch({ throwOnError: false });
  }, [refetch]);

  return {
    consent: (query.data ?? null) as Consent | null,
    error: query.isError,
    retry,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching,
  };
}
