import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as galleryService from "../services/gallery.service";
import type { GalleryOptionsResponse } from "../types/gallery.types";
import { galleryOptionsKeys, useGalleryOptions } from "./useGalleryOptions";

vi.mock("../services/gallery.service", () => ({
  fetchGalleryOptions: vi.fn(),
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

describe("useGalleryOptions hook", () => {
  const mockOptionsResponse: GalleryOptionsResponse = {
    data: {
      procedures: [
        { code: "rhinoplasty", en: "Rhinoplasty", ar: "تجميل الأنف" },
      ],
      timeframes: [
        { code: "0-3-months", en: "0-3 Months", ar: "0-3 أشهر", status: "active" },
        { code: "6-months", en: "6 Months", ar: "6 أشهر", status: "active" },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes the stable query key factory", () => {
    expect(galleryOptionsKeys.all).toEqual(["gallery", "options"]);
  });

  it("returns procedures and timeframes on successful fetch", async () => {
    vi.mocked(galleryService.fetchGalleryOptions).mockResolvedValueOnce(mockOptionsResponse);
    const { wrapper } = createTestWrapper();

    const { result } = renderHook(() => useGalleryOptions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.procedures).toEqual(mockOptionsResponse.data.procedures);
      expect(result.current.timeframes).toEqual(mockOptionsResponse.data.timeframes);
      expect(result.current.isError).toBe(false);
    });
  });

  it("handles error states and retry", async () => {
    vi.mocked(galleryService.fetchGalleryOptions)
      .mockRejectedValueOnce(new Error("Network failure"))
      .mockResolvedValueOnce(mockOptionsResponse);
    const { wrapper } = createTestWrapper();

    const { result } = renderHook(() => useGalleryOptions(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.procedures).toEqual([]);
      expect(result.current.timeframes).toEqual([]);
    });

    await act(async () => {
      await result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(false);
      expect(result.current.timeframes).toEqual(mockOptionsResponse.data.timeframes);
    });
  });
});

