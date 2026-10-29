import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as proceduresService from "../services/procedures.service";
import { proceduresKeys, useProcedures } from "./useProcedures";

vi.mock("../services/procedures.service", () => ({
  fetchProcedures: vi.fn(),
}));

function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return { queryClient, wrapper: Wrapper };
}

describe("useProcedures hook", () => {
  const mockProcedures: proceduresService.ProcedureOption[] = [
    { code: "rhinoplasty", en: "Rhinoplasty", ar: "تجميل الأنف" },
    { code: "revision_rhinoplasty", en: "Revision rhinoplasty", ar: "إعادة تجميل الأنف" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes the stable query key factory", () => {
    expect(proceduresKeys.all).toEqual(["procedures"]);
  });

  it("shares one in-flight request when multiple consumers mount together", async () => {
    vi.mocked(proceduresService.fetchProcedures).mockResolvedValueOnce(mockProcedures);
    const { wrapper } = createTestWrapper();

    const { result: consumerA } = renderHook(() => useProcedures(), { wrapper });
    const { result: consumerB } = renderHook(() => useProcedures(), { wrapper });

    await waitFor(() => {
      expect(consumerA.current.procedures).toEqual(mockProcedures);
      expect(consumerB.current.procedures).toEqual(mockProcedures);
    });

    expect(consumerA.current.error).toBe(false);
    expect(consumerB.current.error).toBe(false);
    expect(proceduresService.fetchProcedures).toHaveBeenCalledTimes(1);
  });

  it("reuses cached data on remount without issuing a second request within the session", async () => {
    vi.mocked(proceduresService.fetchProcedures).mockResolvedValueOnce(mockProcedures);
    const { wrapper } = createTestWrapper();

    const { result: first, unmount } = renderHook(() => useProcedures(), { wrapper });
    await waitFor(() => expect(first.current.procedures).toEqual(mockProcedures));
    unmount();

    const { result: second } = renderHook(() => useProcedures(), { wrapper });
    expect(second.current.procedures).toEqual(mockProcedures);
    expect(second.current.error).toBe(false);
    expect(proceduresService.fetchProcedures).toHaveBeenCalledTimes(1);
  });

  it("sets error to true and keeps procedures empty without automatic retry on failure", async () => {
    vi.mocked(proceduresService.fetchProcedures).mockRejectedValueOnce(
      new Error("Catalog service unavailable"),
    );
    const { wrapper } = createTestWrapper();

    const { result } = renderHook(() => useProcedures(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe(true);
    });
    expect(result.current.procedures).toEqual([]);
    expect(proceduresService.fetchProcedures).toHaveBeenCalledTimes(1);
  });

  it("stays failed when consumer remounts after failure without an explicit retry", async () => {
    vi.mocked(proceduresService.fetchProcedures).mockRejectedValueOnce(
      new Error("Catalog failure"),
    );
    const { wrapper } = createTestWrapper();

    const { result: first, unmount } = renderHook(() => useProcedures(), { wrapper });
    await waitFor(() => expect(first.current.error).toBe(true));
    unmount();

    const { result: second } = renderHook(() => useProcedures(), { wrapper });
    expect(second.current.error).toBe(true);
    expect(second.current.procedures).toEqual([]);
    expect(proceduresService.fetchProcedures).toHaveBeenCalledTimes(1);
  });

  it("allows consumer to retry after failure, issuing one new request and clearing error on success", async () => {
    vi.mocked(proceduresService.fetchProcedures)
      .mockRejectedValueOnce(new Error("First attempt failed"))
      .mockResolvedValueOnce(mockProcedures);
    const { wrapper } = createTestWrapper();

    const { result } = renderHook(() => useProcedures(), { wrapper });

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.procedures).toEqual([]);

    await act(async () => {
      await result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.error).toBe(false);
      expect(result.current.procedures).toEqual(mockProcedures);
    });
    expect(proceduresService.fetchProcedures).toHaveBeenCalledTimes(2);
  });

  it("restores error state if a retry attempt fails again", async () => {
    vi.mocked(proceduresService.fetchProcedures)
      .mockRejectedValueOnce(new Error("First attempt failed"))
      .mockRejectedValueOnce(new Error("Second attempt failed"));
    const { wrapper } = createTestWrapper();

    const { result } = renderHook(() => useProcedures(), { wrapper });

    await waitFor(() => expect(result.current.error).toBe(true));

    await act(async () => {
      await result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.error).toBe(true);
    });
    expect(result.current.procedures).toEqual([]);
    expect(proceduresService.fetchProcedures).toHaveBeenCalledTimes(2);
  });

  it("aborts the request signal when consumer unmounts mid-flight", async () => {
    let capturedSignal: AbortSignal | undefined;
    vi.mocked(proceduresService.fetchProcedures).mockImplementationOnce((options) => {
      const signal = options?.signal;
      capturedSignal = signal;
      return new Promise((_resolve, reject) => {
        signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });

    const { wrapper } = createTestWrapper();
    const { unmount } = renderHook(() => useProcedures(), { wrapper });

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(false);

    unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });

  it("preserves exact backend codes and both en and ar labels without aliases", async () => {
    const rawBackendData: proceduresService.ProcedureOption[] = [
      { code: "rhinoplasty", en: "Rhinoplasty", ar: "تجميل الأنف" },
      { code: "revision_rhinoplasty", en: "Revision rhinoplasty", ar: "إعادة تجميل الأنف" },
    ];
    vi.mocked(proceduresService.fetchProcedures).mockResolvedValueOnce(rawBackendData);
    const { wrapper } = createTestWrapper();

    const { result } = renderHook(() => useProcedures(), { wrapper });

    await waitFor(() => expect(result.current.procedures).toEqual(rawBackendData));
    expect(result.current.procedures[0].code).toBe("rhinoplasty");
    expect(result.current.procedures[0].en).toBe("Rhinoplasty");
    expect(result.current.procedures[0].ar).toBe("تجميل الأنف");
    expect(result.current.procedures[1].code).toBe("revision_rhinoplasty");
    expect(result.current.procedures[1].en).toBe("Revision rhinoplasty");
    expect(result.current.procedures[1].ar).toBe("إعادة تجميل الأنف");
  });
});
