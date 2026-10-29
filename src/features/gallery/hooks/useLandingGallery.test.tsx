import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { galleryKeys, useLandingGallery } from "./useLandingGallery";
import {
  fetchGalleryContent,
  fetchLandingGalleryCases,
} from "../services/gallery.service";
import type {
  GalleryCaptionContent,
  GalleryPublicCase,
  GallerySectionContent,
} from "../types/gallery.types";

vi.mock("../services/gallery.service", () => ({
  fetchLandingGalleryCases: vi.fn(),
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
  {
    id: "case-2",
    url: "/display-2",
    thumbnail_url: "/thumb-2",
    procedure_tag: "rhinoplasty",
    timeframe_badge: "1-year",
    before_position: "right",
    width: 1200,
    height: 800,
  },
];

const mockSectionEn: GallerySectionContent = {
  type: "gallery_section",
  lang: "en",
  eyebrow: "GALLERY",
  heading: "Real People. Real Results.",
  introduction: "Explore patient transformations.",
  statistics: [{ key: "patients", value: "500+", label: "Happy Patients" }],
};

const mockCaptionsEn: Record<string, GalleryCaptionContent> = {
  "case-1": {
    type: "gallery_caption",
    image_id: "case-1",
    lang: "en",
    alt_text: "Case 1 alt",
    caption: "Case 1 caption",
  },
};

describe("useLandingGallery hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("generates stable, locale-scoped query keys", () => {
    expect(galleryKeys.all).toEqual(["gallery"]);
    expect(galleryKeys.landing("en")).toEqual(["gallery", "landing", "en"]);
    expect(galleryKeys.landing("ar")).toEqual(["gallery", "landing", "ar"]);
  });

  it("loads landing gallery data for specified locale without initial data", async () => {
    vi.mocked(fetchLandingGalleryCases).mockResolvedValueOnce(mockCases);
    vi.mocked(fetchGalleryContent).mockResolvedValueOnce({
      section: mockSectionEn,
      captions: mockCaptionsEn,
    });

    const { result } = renderHook(() => useLandingGallery("en"), {
      wrapper: createTestWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.cases).toBeNull();
    expect(result.current.content).toBeNull();
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.cases).toEqual(mockCases);
    expect(result.current.content).toEqual(mockSectionEn);
    expect(result.current.captions).toEqual(mockCaptionsEn);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();

    expect(fetchLandingGalleryCases).toHaveBeenCalledWith(5, {
      signal: expect.any(AbortSignal),
    });
    expect(fetchGalleryContent).toHaveBeenCalledWith(
      "en",
      ["case-1", "case-2"],
      { signal: expect.any(AbortSignal) },
    );
  });

  it("hydrates immediately when initialCases is provided without mount refetch", () => {
    const { result } = renderHook(
      () =>
        useLandingGallery("en", {
          initialCases: mockCases,
          initialContent: mockSectionEn,
          initialCaptions: mockCaptionsEn,
        }),
      { wrapper: createTestWrapper() },
    );

    expect(result.current.cases).toEqual(mockCases);
    expect(result.current.content).toEqual(mockSectionEn);
    expect(result.current.captions).toEqual(mockCaptionsEn);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();

    expect(fetchLandingGalleryCases).not.toHaveBeenCalled();
    expect(fetchGalleryContent).not.toHaveBeenCalled();
  });

  it("does not leak initialContent across locale change and fetches for mismatched locale", async () => {
    const mockSectionAr: GallerySectionContent = {
      ...mockSectionEn,
      lang: "ar",
      heading: "نتائج حقيقية",
    };
    vi.mocked(fetchLandingGalleryCases).mockResolvedValueOnce(mockCases);
    vi.mocked(fetchGalleryContent).mockResolvedValueOnce({
      section: mockSectionAr,
      captions: {},
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = createTestWrapper(queryClient);

    const { result, rerender } = renderHook(
      ({ lang }: { lang: string }) =>
        useLandingGallery(lang, {
          initialCases: mockCases,
          initialContent: mockSectionEn,
          initialCaptions: mockCaptionsEn,
        }),
      {
        initialProps: { lang: "en" },
        wrapper,
      },
    );

    expect(result.current.content).toEqual(mockSectionEn);
    expect(fetchLandingGalleryCases).not.toHaveBeenCalled();

    // Switch to Arabic: initialContent is English so should not be used
    rerender({ lang: "ar" });

    await waitFor(() => expect(result.current.content).toEqual(mockSectionAr));
    expect(fetchLandingGalleryCases).toHaveBeenCalledTimes(1);
    expect(fetchGalleryContent).toHaveBeenCalledWith("ar", ["case-1", "case-2"], {
      signal: expect.any(AbortSignal),
    });
  });

  it("isolates cache entries per locale and reuses cached responses", async () => {
    vi.mocked(fetchLandingGalleryCases).mockResolvedValue(mockCases);
    vi.mocked(fetchGalleryContent).mockImplementation(async (lang) => ({
      section: { ...mockSectionEn, lang },
      captions: mockCaptionsEn,
    }));

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = createTestWrapper(queryClient);

    const { result, rerender } = renderHook(
      ({ lang }: { lang: string }) => useLandingGallery(lang),
      {
        initialProps: { lang: "en" },
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.content?.lang).toBe("en"));

    // Switch to Arabic
    rerender({ lang: "ar" });
    await waitFor(() => expect(result.current.content?.lang).toBe("ar"));

    // Switch back to English (cached, should not call fetch again)
    rerender({ lang: "en" });
    expect(result.current.content?.lang).toBe("en");
    expect(fetchLandingGalleryCases).toHaveBeenCalledTimes(2);
  });

  it("sets error to true and cases to null on failure without automatic retry", async () => {
    vi.mocked(fetchLandingGalleryCases).mockRejectedValueOnce(
      new Error("Network failure"),
    );

    const { result } = renderHook(() => useLandingGallery("en"), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.cases).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(fetchLandingGalleryCases).toHaveBeenCalledTimes(1);
  });

  it("recovers on user-triggered retry after failure", async () => {
    vi.mocked(fetchLandingGalleryCases)
      .mockRejectedValueOnce(new Error("Network drop"))
      .mockResolvedValueOnce(mockCases);
    vi.mocked(fetchGalleryContent).mockResolvedValueOnce({
      section: mockSectionEn,
      captions: mockCaptionsEn,
    });

    const { result } = renderHook(() => useLandingGallery("en"), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.cases).toBeNull();

    await act(async () => {
      await result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.cases).toEqual(mockCases);
      expect(result.current.content).toEqual(mockSectionEn);
    });
    expect(fetchLandingGalleryCases).toHaveBeenCalledTimes(2);
  });

  it("aborts in-flight request on unmount", async () => {
    let capturedSignal: AbortSignal | undefined;
    vi.mocked(fetchLandingGalleryCases).mockImplementation(async (_size, options) => {
      capturedSignal = options?.signal;
      return new Promise(() => {}); // never resolves
    });

    const { unmount } = renderHook(() => useLandingGallery("en"), {
      wrapper: createTestWrapper(),
    });

    expect(fetchLandingGalleryCases).toHaveBeenCalledTimes(1);
    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(false);

    unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });
});

