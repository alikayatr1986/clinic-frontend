"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { isAbortError } from "@/lib/api";

const MAX_QUERY_RETRIES = 2;
const QUERY_STALE_TIME_MS = 30_000;

/**
 * Retry transient failures only.
 *
 * Cancellations and 4xx responses (validation, auth, not-found) are final, so
 * they are never retried. Writes opt out entirely via the mutation defaults.
 */
function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isAbortError(error)) return false;
  const status =
    typeof error === "object" && error !== null
      ? (error as { status?: unknown }).status
      : undefined;
  if (typeof status === "number" && status >= 400 && status < 500) return false;
  return failureCount < MAX_QUERY_RETRIES;
}

/** Build a QueryClient with the shared browser server-state defaults. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        retry: shouldRetryQuery,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Browser: one persistent client shared by the whole app.
 * Server: a fresh client per render, so requests never share state.
 */
export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") return createQueryClient();
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}
