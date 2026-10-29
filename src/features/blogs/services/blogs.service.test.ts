import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, ApiError } from "@/lib/api";
import {
  fetchBlogCategories,
  fetchBlogDetail,
  fetchBlogHome,
  fetchBlogList,
  fetchBlogSitemap,
} from "./blogs.service";
import type {
  BlogCategory,
  BlogDetail,
  BlogHome,
  BlogList,
  BlogSummary,
} from "../types/blogs.types";

vi.mock("@/lib/api", () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    readonly fields: string[];
    constructor(status: number, code = "", fields: string[] = []) {
      super(`API request failed with status ${status}`);
      this.name = "ApiError";
      this.status = status;
      this.code = code;
      this.fields = fields;
    }
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

const mockPostSummary = (n: number): BlogSummary => ({
  id: `id-${n}`,
  slug: `post-${n}`,
  lang: "en",
  title: `Post ${n}`,
  excerpt: `Excerpt ${n}`,
  category: { key: "rhinoplasty", label: "Rhinoplasty" },
  first_published_at: "2026-01-05T00:00:00Z",
  last_published_at: "2026-01-05T00:00:00Z",
  reading_time_minutes: 3,
  author_name: "Dr. Author",
  cover: null,
});

describe("blogs.service", () => {
  describe("fetchBlogCategories", () => {
    it("calls categories endpoint with lang query and unwraps data", async () => {
      const categories: BlogCategory[] = [
        { key: "rhinoplasty", label: "Rhinoplasty" },
        { key: "revision", label: "Revision" },
      ];
      vi.mocked(apiRequest).mockResolvedValueOnce({ data: categories });

      const result = await fetchBlogCategories("en");

      expect(result).toEqual(categories);
      expect(apiRequest).toHaveBeenCalledWith("/api/v1/blogs/categories", {
        query: { lang: "en" },
        signal: undefined,
      });
    });

    it("returns empty array when data envelope is missing", async () => {
      vi.mocked(apiRequest).mockResolvedValueOnce({});

      const result = await fetchBlogCategories("ar");

      expect(result).toEqual([]);
      expect(apiRequest).toHaveBeenCalledWith("/api/v1/blogs/categories", {
        query: { lang: "ar" },
        signal: undefined,
      });
    });

    it("forwards signal and propagates transport errors", async () => {
      const controller = new AbortController();
      vi.mocked(apiRequest).mockRejectedValueOnce(new ApiError(500, "SERVER_ERROR"));

      await expect(
        fetchBlogCategories("en", { signal: controller.signal }),
      ).rejects.toThrow("API request failed with status 500");

      expect(apiRequest).toHaveBeenCalledWith("/api/v1/blogs/categories", {
        query: { lang: "en" },
        signal: controller.signal,
      });
    });
  });

  describe("fetchBlogList", () => {
    it("calls blogs endpoint with query parameters and unwraps data and total", async () => {
      const listData: BlogList = {
        data: [mockPostSummary(1), mockPostSummary(2)],
        total: 2,
      };
      vi.mocked(apiRequest).mockResolvedValueOnce(listData);

      const result = await fetchBlogList({
        lang: "en",
        page: 1,
        pageSize: 9,
        category: "rhinoplasty",
        q: "tip",
      });

      expect(result).toEqual(listData);
      expect(apiRequest).toHaveBeenCalledWith("/api/v1/blogs", {
        query: {
          lang: "en",
          page: 1,
          page_size: 9,
          category: "rhinoplasty",
          q: "tip",
        },
        signal: undefined,
      });
    });

    it("omits empty category and q from query and defaults data/total when missing", async () => {
      vi.mocked(apiRequest).mockResolvedValueOnce({});

      const result = await fetchBlogList({
        lang: "ar",
        page: 2,
        pageSize: 6,
        category: "",
        q: "",
      });

      expect(result).toEqual({ data: [], total: 0 });
      expect(apiRequest).toHaveBeenCalledWith("/api/v1/blogs", {
        query: {
          lang: "ar",
          page: 2,
          page_size: 6,
          category: undefined,
          q: undefined,
        },
        signal: undefined,
      });
    });

    it("forwards abort signal to transport", async () => {
      const controller = new AbortController();
      vi.mocked(apiRequest).mockResolvedValueOnce({ data: [], total: 0 });

      await fetchBlogList(
        { lang: "en", page: 1, pageSize: 10 },
        { signal: controller.signal },
      );

      expect(apiRequest).toHaveBeenCalledWith("/api/v1/blogs", {
        query: {
          lang: "en",
          page: 1,
          page_size: 10,
          category: undefined,
          q: undefined,
        },
        signal: controller.signal,
      });
    });
  });

  describe("fetchBlogSitemap", () => {
    it("fetches single page when results are within page size", async () => {
      const entries = [
        { slug: "post-1", last_published_at: "2026-01-01T00:00:00Z" },
        { slug: "post-2", last_published_at: "2026-01-02T00:00:00Z" },
      ];
      vi.mocked(apiRequest).mockResolvedValueOnce({ data: entries, total: 2 });

      const result = await fetchBlogSitemap();

      expect(result).toEqual(entries);
      expect(apiRequest).toHaveBeenCalledTimes(1);
      expect(apiRequest).toHaveBeenCalledWith("/api/v1/blogs/sitemap", {
        query: { page: 1, page_size: 500 },
        signal: undefined,
      });
    });

    it("paginates across multiple pages until all total entries are collected", async () => {
      const page1 = Array.from({ length: 500 }, (_, i) => ({
        slug: `post-${i + 1}`,
        last_published_at: "2026-01-01T00:00:00Z",
      }));
      const page2 = [
        { slug: "post-501", last_published_at: "2026-01-02T00:00:00Z" },
      ];

      vi.mocked(apiRequest)
        .mockResolvedValueOnce({ data: page1, total: 501 })
        .mockResolvedValueOnce({ data: page2, total: 501 });

      const controller = new AbortController();
      const result = await fetchBlogSitemap({ signal: controller.signal });

      expect(result).toHaveLength(501);
      expect(apiRequest).toHaveBeenCalledTimes(2);
      expect(apiRequest).toHaveBeenNthCalledWith(1, "/api/v1/blogs/sitemap", {
        query: { page: 1, page_size: 500 },
        signal: controller.signal,
      });
      expect(apiRequest).toHaveBeenNthCalledWith(2, "/api/v1/blogs/sitemap", {
        query: { page: 2, page_size: 500 },
        signal: controller.signal,
      });
    });

    it("throws rather than returning partial results if mid-pagination request fails", async () => {
      const page1 = Array.from({ length: 500 }, (_, i) => ({
        slug: `post-${i + 1}`,
        last_published_at: "2026-01-01T00:00:00Z",
      }));

      vi.mocked(apiRequest)
        .mockResolvedValueOnce({ data: page1, total: 600 })
        .mockRejectedValueOnce(new ApiError(500, "SITEMAP_PAGE_FAILED"));

      await expect(fetchBlogSitemap()).rejects.toThrow("API request failed with status 500");
      expect(apiRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe("fetchBlogDetail", () => {
    const mockDetail: BlogDetail = {
      ...mockPostSummary(1),
      body: { schema_version: 1, blocks: [{ type: "paragraph", text: "Hello" }] },
      references: [],
      related_articles: [],
    };

    it("returns blog detail when found", async () => {
      vi.mocked(apiRequest).mockResolvedValueOnce({ data: mockDetail });

      const result = await fetchBlogDetail("post-1", "en");

      expect(result).toEqual(mockDetail);
      expect(apiRequest).toHaveBeenCalledWith("/api/v1/blogs/post-1", {
        query: { lang: "en" },
        signal: undefined,
      });
    });

    it("encodes slug properly in request path", async () => {
      vi.mocked(apiRequest).mockResolvedValueOnce({ data: mockDetail });

      await fetchBlogDetail("post with spaces/and/slashes", "en");

      expect(apiRequest).toHaveBeenCalledWith(
        "/api/v1/blogs/post%20with%20spaces%2Fand%2Fslashes",
        {
          query: { lang: "en" },
          signal: undefined,
        },
      );
    });

    it("returns null for a 404 response status", async () => {
      vi.mocked(apiRequest).mockRejectedValueOnce(new ApiError(404, "NOT_FOUND"));

      const result = await fetchBlogDetail("non-existent-slug", "en");

      expect(result).toBeNull();
    });

    it("throws on 500 or any non-404 status error", async () => {
      const serverError = new ApiError(500, "INTERNAL_ERROR");
      vi.mocked(apiRequest).mockRejectedValueOnce(serverError);

      await expect(fetchBlogDetail("error-slug", "en")).rejects.toThrow(serverError);
    });

    it("throws on network or abort error", async () => {
      const abortError = new DOMException("Aborted", "AbortError");
      vi.mocked(apiRequest).mockRejectedValueOnce(abortError);

      await expect(fetchBlogDetail("slug", "en")).rejects.toThrow(abortError);
    });
  });

  describe("fetchBlogHome", () => {
    it("returns featured post and articles list", async () => {
      const homeData: BlogHome = {
        featured: mockPostSummary(1),
        articles: [mockPostSummary(1), mockPostSummary(2)],
      };
      vi.mocked(apiRequest).mockResolvedValueOnce({ data: homeData });

      const result = await fetchBlogHome("en");

      expect(result).toEqual(homeData);
      expect(apiRequest).toHaveBeenCalledWith("/api/v1/blogs/home", {
        query: { lang: "en" },
        signal: undefined,
      });
    });

    it("returns null featured and empty articles if data envelope is empty", async () => {
      vi.mocked(apiRequest).mockResolvedValueOnce({});

      const result = await fetchBlogHome("ar");

      expect(result).toEqual({ featured: null, articles: [] });
      expect(apiRequest).toHaveBeenCalledWith("/api/v1/blogs/home", {
        query: { lang: "ar" },
        signal: undefined,
      });
    });

    it("throws on failure so callers can distinguish error from empty", async () => {
      const error = new ApiError(503, "SERVICE_UNAVAILABLE");
      vi.mocked(apiRequest).mockRejectedValueOnce(error);

      await expect(fetchBlogHome("en")).rejects.toThrow(error);
    });

    it("forwards signal to transport", async () => {
      const controller = new AbortController();
      vi.mocked(apiRequest).mockResolvedValueOnce({ data: { articles: [] } });

      await fetchBlogHome("en", { signal: controller.signal });

      expect(apiRequest).toHaveBeenCalledWith("/api/v1/blogs/home", {
        query: { lang: "en" },
        signal: controller.signal,
      });
    });
  });
});
