import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, ApiError } from "@/lib/api";
import {
  fetchGalleryCases,
  fetchGalleryContent,
  fetchLandingGalleryCases,
} from "./gallery.service";
import type {
  GalleryCaptionContent,
  GalleryContentResponse,
  GalleryListResponse,
  GalleryPublicCase,
  GallerySectionContent,
} from "../types/gallery.types";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

const mockCase: GalleryPublicCase = {
  id: "case-1",
  url: "/api/v1/gallery/case-1/media/display",
  thumbnail_url: "/api/v1/gallery/case-1/media/thumbnail",
  procedure_tag: "rhinoplasty",
  timeframe_badge: "6-months",
  before_position: "left",
  width: 1200,
  height: 800,
};

const mockSection: GallerySectionContent = {
  type: "gallery_section",
  lang: "en",
  eyebrow: "GALLERY",
  heading: "Real People",
  introduction: "Intro text",
  statistics: [{ key: "patients", value: "500+", label: "Patients" }],
};

const mockCaption: GalleryCaptionContent = {
  type: "gallery_caption",
  image_id: "case-1",
  lang: "en",
  alt_text: "Case 1 alt",
  caption: "Case 1 caption",
};

describe("gallery.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchLandingGalleryCases", () => {
    it("requests page 1 with default pageSize 5", async () => {
      vi.mocked(apiRequest).mockResolvedValueOnce({
        data: [mockCase],
        page: 1,
        page_size: 5,
        total: 1,
      } as GalleryListResponse);

      const cases = await fetchLandingGalleryCases();

      expect(apiRequest).toHaveBeenCalledWith("/api/v1/gallery", {
        query: {
          page: 1,
          page_size: 5,
        },
        signal: undefined,
        headers: undefined,
        cache: undefined,
      });
      expect(cases).toEqual([mockCase]);
    });

    it("respects custom pageSize and forwards options", async () => {
      const controller = new AbortController();
      vi.mocked(apiRequest).mockResolvedValueOnce({
        data: [mockCase],
        page: 1,
        page_size: 10,
        total: 1,
      } as GalleryListResponse);

      const cases = await fetchLandingGalleryCases(10, {
        signal: controller.signal,
        headers: { "X-Custom": "test" },
      });

      expect(apiRequest).toHaveBeenCalledWith("/api/v1/gallery", {
        query: {
          page: 1,
          page_size: 10,
        },
        signal: controller.signal,
        headers: { "X-Custom": "test" },
        cache: undefined,
      });
      expect(cases).toEqual([mockCase]);
    });

    it("handles empty or missing data envelope safely", async () => {
      vi.mocked(apiRequest).mockResolvedValueOnce({} as GalleryListResponse);

      const cases = await fetchLandingGalleryCases();
      expect(cases).toEqual([]);
    });

    it("propagates ApiError on request failure", async () => {
      vi.mocked(apiRequest).mockRejectedValueOnce(
        new ApiError(500, "INTERNAL_ERROR"),
      );

      await expect(fetchLandingGalleryCases()).rejects.toThrow(ApiError);
    });
  });

  describe("fetchGalleryCases", () => {
    it("serializes query parameters and omits undefined/empty values", async () => {
      vi.mocked(apiRequest).mockResolvedValueOnce({
        data: [mockCase],
        page: 2,
        page_size: 12,
        total: 25,
      } as GalleryListResponse);

      const res = await fetchGalleryCases({
        page: 2,
        page_size: 12,
        procedure_tag: "rhinoplasty",
        timeframe_badge: "6-months",
      });

      expect(apiRequest).toHaveBeenCalledWith("/api/v1/gallery", {
        query: {
          page: 2,
          page_size: 12,
          procedure_tag: "rhinoplasty",
          timeframe_badge: "6-months",
        },
        signal: undefined,
        headers: undefined,
        cache: undefined,
      });
      expect(res.data).toEqual([mockCase]);
      expect(res.total).toBe(25);
      expect(res.page).toBe(2);
      expect(res.page_size).toBe(12);
    });

    it("omits empty string or non-positive numbers from query", async () => {
      vi.mocked(apiRequest).mockResolvedValueOnce({
        data: [],
        page: 1,
        page_size: 12,
        total: 0,
      } as GalleryListResponse);

      await fetchGalleryCases({
        page: 0,
        page_size: -1,
        procedure_tag: "",
        timeframe_badge: "",
      });

      expect(apiRequest).toHaveBeenCalledWith("/api/v1/gallery", {
        query: {
          page: undefined,
          page_size: undefined,
          procedure_tag: undefined,
          timeframe_badge: undefined,
        },
        signal: undefined,
        headers: undefined,
        cache: undefined,
      });
    });

    it("forwards signal and headers in options", async () => {
      const controller = new AbortController();
      vi.mocked(apiRequest).mockResolvedValueOnce({
        data: [],
        page: 1,
        page_size: 12,
        total: 0,
      } as GalleryListResponse);

      await fetchGalleryCases(
        { page: 1 },
        { signal: controller.signal, headers: { Authorization: "Bearer token" } },
      );

      expect(apiRequest).toHaveBeenCalledWith(
        "/api/v1/gallery",
        expect.objectContaining({
          signal: controller.signal,
          headers: { Authorization: "Bearer token" },
        }),
      );
    });

    it("propagates ApiError with status 400 on validation rejection", async () => {
      vi.mocked(apiRequest).mockRejectedValueOnce(
        new ApiError(400, "INVALID_FILTER", ["procedure_tag"]),
      );

      await expect(
        fetchGalleryCases({ procedure_tag: "invalid" }),
      ).rejects.toThrow(ApiError);
    });
  });

  describe("fetchGalleryContent", () => {
    it("requests gallery content for locale and separates section and captions", async () => {
      const response: GalleryContentResponse = {
        data: [mockSection, mockCaption],
      };
      vi.mocked(apiRequest).mockResolvedValueOnce(response);

      const res = await fetchGalleryContent("en", ["case-1"]);

      expect(apiRequest).toHaveBeenCalledWith("/api/v1/gallery-content", {
        query: {
          lang: "en",
          image_ids: ["case-1"],
        },
        signal: undefined,
        headers: undefined,
        cache: undefined,
      });
      expect(res.section).toEqual(mockSection);
      expect(res.captions["case-1"]).toEqual(mockCaption);
    });

    it("omits image_ids when array is empty", async () => {
      vi.mocked(apiRequest).mockResolvedValueOnce({ data: [mockSection] });

      const res = await fetchGalleryContent("ar", []);

      expect(apiRequest).toHaveBeenCalledWith("/api/v1/gallery-content", {
        query: {
          lang: "ar",
          image_ids: undefined,
        },
        signal: undefined,
        headers: undefined,
        cache: undefined,
      });
      expect(res.section).toEqual(mockSection);
      expect(res.captions).toEqual({});
    });

    it("handles empty or missing response payload safely", async () => {
      vi.mocked(apiRequest).mockResolvedValueOnce({} as GalleryContentResponse);

      const res = await fetchGalleryContent("en");

      expect(res.section).toBeNull();
      expect(res.captions).toEqual({});
    });

    it("forwards signal and propagates ApiError on network or 5xx failure", async () => {
      const controller = new AbortController();
      vi.mocked(apiRequest).mockRejectedValueOnce(
        new ApiError(503, "SERVICE_UNAVAILABLE"),
      );

      await expect(
        fetchGalleryContent("en", ["case-1"], { signal: controller.signal }),
      ).rejects.toThrow(ApiError);
    });
  });
});

