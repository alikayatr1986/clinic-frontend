import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api";
import {
  createQueryClient,
  getQueryClient,
  QueryProvider,
} from "@/lib/query-client-provider";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("query-client-provider", () => {
  it("reuses one browser QueryClient across provider renders and trees", () => {
    const first = renderHook(() => useQueryClient(), { wrapper: QueryProvider });
    const firstClient: QueryClient = first.result.current;

    first.rerender();
    expect(first.result.current).toBe(firstClient);

    const second = renderHook(() => useQueryClient(), {
      wrapper: QueryProvider,
    });
    expect(second.result.current).toBe(firstClient);
    expect(getQueryClient()).toBe(firstClient);
  });

  it("creates a fresh QueryClient for every server render", () => {
    vi.stubGlobal("window", undefined);

    const first = getQueryClient();
    const second = getQueryClient();

    expect(first).toBeInstanceOf(QueryClient);
    expect(second).toBeInstanceOf(QueryClient);
    expect(first).not.toBe(second);
  });

  it("does not retry 4xx or aborted queries", () => {
    const retry = createQueryClient().getDefaultOptions().queries?.retry;
    if (typeof retry !== "function") throw new Error("expected a retry policy");

    expect(retry(0, new ApiError(404, "not_found"))).toBe(false);
    expect(retry(0, new ApiError(422, "validation_failed", ["email"]))).toBe(
      false,
    );
    expect(
      retry(0, Object.assign(new Error("aborted"), { name: "AbortError" })),
    ).toBe(false);
    expect(
      retry(0, Object.assign(new Error("timed out"), { name: "TimeoutError" })),
    ).toBe(false);
  });

  it("retries transient query failures and never retries mutations", () => {
    const client = createQueryClient();
    const retry = client.getDefaultOptions().queries?.retry;
    if (typeof retry !== "function") throw new Error("expected a retry policy");

    expect(retry(0, new ApiError(500, "internal"))).toBe(true);
    expect(retry(1, new Error("network"))).toBe(true);
    expect(retry(2, new Error("network"))).toBe(false);
    expect(client.getDefaultOptions().mutations?.retry).toBe(false);
  });

  it("shares a 30 second stale window across queries", () => {
    expect(createQueryClient().getDefaultOptions().queries?.staleTime).toBe(
      30_000,
    );
  });
});
