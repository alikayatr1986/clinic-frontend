import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { galleryKeys, useGalleryCases } from "./useGalleryCases";
import {
  fetchGalleryCases,
  fetchGalleryContent,
} from "../services/gallery.service";
import type {
  GalleryCaptionContent,
  GalleryListResponse,
  GalleryPublicCase,
  GallerySectionContent,
} from "../types/gallery.types";

vi.mock("../services/gallery.service", () => ({
  fetchGalleryCases: vi.fn(),
  fetchGalleryContent: vi.fn(),
}));

function createTestWrapper(client?: QueryClient) {
  const queryClient =
    client ??
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const mockCases: GalleryPublicCase[] = [
  {
    id: "case-1",
    url: "/display-1",
    thumbnail_url: "/thumb-1",
    procedure_tag: "rhinoplasty",
    timeframe_badge: "6-months",
    before_position: "left",
    width: 1200,
    height: 800,
  },
];

const mockListResponse: GalleryListResponse = {
  data: mockCases,
  page: 1,
  page_size: 12,
  total: 1,
};

const mockSection: GallerySectionContent = {
  type: "gallery_section",
  lang: "en",
  eyebrow: "GALLERY",
  heading: "Heading",
  introduction: "Intro",
  statistics: [],
};

const mockCaptions: Record<string, GalleryCaptionContent> = {
  "case-1": {
    type: "gallery_caption",
    image_id: "case-1",
    lang: "en",
    alt_text: "Alt 1",
    caption: "Caption 1",
  },
};

describe("useGalleryCases hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("generates stable query keys incorporating all active dimensions", () => {
    const keyDefault = galleryKeys.list("en");
    expect(keyDefault).toEqual([
      "gallery",
      "list",
      "en",
      {
        page: 1,
        page_size: 12,
        procedure_tag: undefined,
        timeframe_badge: undefined,
      },
    ]);

    const keyFiltered = galleryKeys.list("ar", {
      page: 2,
      page_size: 12,
      procedure_tag: "rhinoplasty",
      timeframe_badge: "6-months",
    });
    expect(keyFiltered).toEqual([
      "gallery",
      "list",
      "ar",
      {
        page: 2,
        page_size: 12,
        procedure_tag: "rhinoplasty",
        timeframe_badge: "6-months",
      },
    ]);
  });

  it("fetches cases and content with signal forwarding", async () => {
    vi.mocked(fetchGalleryCases).mockResolvedValueOnce(mockListResponse);
    vi.mocked(fetchGalleryContent).mockResolvedValueOnce({
      section: mockSection,
      captions: mockCaptions,
    });

    const { result } = renderHook(
      () =>
        useGalleryCases("en", {
          page: 1,
          procedure_tag: "rhinoplasty",
          timeframe_badge: "6-months",
        }),
      { wrapper: createTestWrapper() },
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.cases).toEqual(mockCases);
    expect(result.current.total).toBe(1);
    expect(result.current.sectionContent).toEqual(mockSection);
    expect(result.current.captions).toEqual(mockCaptions);

    expect(fetchGalleryCases).toHaveBeenCalledWith(
      {
        page: 1,
        page_size: 12,
        procedure_tag: "rhinoplasty",
        timeframe_badge: "6-months",
      },
      { signal: expect.any(AbortSignal) },
    );
    expect(fetchGalleryContent).toHaveBeenCalledWith("en", ["case-1"], {
      signal: expect.any(AbortSignal),
    });
  });

  it("hydrates from initialCases without remote fetch when parameters match initial", () => {
    const { result } = renderHook(
      () =>
        useGalleryCases(
          "en",
          { page: 1 },
          {
            initialCases: mockCases,
            initialTotal: 1,
            initialPage: 1,
            initialCaptions: mockCaptions,
            initialSectionContent: mockSection,
          },
        ),
      { wrapper: createTestWrapper() },
    );

    expect(result.current.cases).toEqual(mockCases);
    expect(result.current.total).toBe(1);
    expect(result.current.isLoading).toBe(false);
    expect(fetchGalleryCases).not.toHaveBeenCalled();
    expect(fetchGalleryContent).not.toHaveBeenCalled();
  });

  it("does not use initialCases when active filters differ from initial defaults", async () => {
    vi.mocked(fetchGalleryCases).mockResolvedValueOnce(mockListResponse);
    vi.mocked(fetchGalleryContent).mockResolvedValueOnce({
      section: mockSection,
      captions: mockCaptions,
    });

    const { result } = renderHook(
      () =>
        useGalleryCases(
          "en",
          { page: 1, procedure_tag: "rhinoplasty" },
          {
            initialCases: mockCases,
            initialTotal: 1,
            initialPage: 1,
          },
        ),
      { wrapper: createTestWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchGalleryCases).toHaveBeenCalledTimes(1);
  });

  it("isolates cache entries across different filter values", async () => {
    vi.mocked(fetchGalleryCases).mockImplementation(async (params) => ({
      data: [{ ...mockCases[0], procedure_tag: params?.procedure_tag || "all" }],
      page: 1,
      page_size: 12,
      total: 1,
    }));
    vi.mocked(fetchGalleryContent).mockResolvedValue({
      section: mockSection,
      captions: mockCaptions,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = createTestWrapper(queryClient);

    const { result, rerender } = renderHook(
      ({ proc }: { proc: string }) =>
        useGalleryCases("en", { procedure_tag: proc }),
      {
        initialProps: { proc: "rhinoplasty" },
        wrapper,
      },
    );

    await waitFor(() =>
      expect(result.current.cases?.[0].procedure_tag).toBe("rhinoplasty"),
    );

    // Switch to septoplasty
    rerender({ proc: "septoplasty" });
    await waitFor(() =>
      expect(result.current.cases?.[0].procedure_tag).toBe("septoplasty"),
    );

    // Switch back to rhinoplasty (cached, no extra fetch)
    rerender({ proc: "rhinoplasty" });
    expect(result.current.cases?.[0].procedure_tag).toBe("rhinoplasty");
    expect(fetchGalleryCases).toHaveBeenCalledTimes(2);
  });

  it("sets error state on failure and recovers via retry()", async () => {
    vi.mocked(fetchGalleryCases)
      .mockRejectedValueOnce(new Error("500 Internal Server Error"))
      .mockResolvedValueOnce(mockListResponse);
    vi.mocked(fetchGalleryContent).mockResolvedValueOnce({
      section: mockSection,
      captions: mockCaptions,
    });

    const { result } = renderHook(() => useGalleryCases("en", { page: 1 }), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.cases).toBeNull();

    await act(async () => {
      await result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(false);
      expect(result.current.cases).toEqual(mockCases);
    });
    expect(fetchGalleryCases).toHaveBeenCalledTimes(2);
  });

  it("aborts in-flight request when component unmounts", async () => {
    let capturedSignal: AbortSignal | undefined;
    vi.mocked(fetchGalleryCases).mockImplementation(async (_params, options) => {
      capturedSignal = options?.signal;
      return new Promise(() => {}); // never resolves
    });

    const { unmount } = renderHook(() => useGalleryCases("en", { page: 1 }), {
      wrapper: createTestWrapper(),
    });

    expect(fetchGalleryCases).toHaveBeenCalledTimes(1);
    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(false);

    unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });
});
