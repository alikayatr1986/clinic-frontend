"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  fetchProcedures,
  type ProcedureOption,
} from "../services/procedures.service";

export type { ProcedureOption };

export const proceduresKeys = {
  all: ["procedures"] as const,
};

export function proceduresQueryOptions() {
  return queryOptions({
    queryKey: proceduresKeys.all,
    queryFn: ({ signal }) => fetchProcedures({ signal }),
    staleTime: Infinity,
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export const proceduresQuery = proceduresQueryOptions;

export function useProcedures() {
  const query = useQuery(proceduresQueryOptions());
  const { refetch } = query;

  const retry = useCallback(() => {
    return refetch({ throwOnError: false });
  }, [refetch]);

  return {
    procedures: query.data ?? [],
    error: query.isError,
    retry,
  };
}
