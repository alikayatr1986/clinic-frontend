import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { blogKeys, useBlogHome } from "./useBlogHome";
import { fetchBlogHome } from "@/features/blogs/services/blogs.service";
import type { BlogHome, BlogSummary } from "@/features/blogs/types/blogs.types";

vi.mock("@/features/blogs/services/blogs.service", () => ({
  fetchBlogHome: vi.fn(),
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

const mockSummary = (n: number, lang: "en" | "ar" = "en"): BlogSummary => ({
  id: `id-${n}`,
  slug: `post-${n}`,
  lang,
  title: `Post ${n}`,
  excerpt: `Excerpt ${n}`,
  category: { key: "rhinoplasty", label: "Rhinoplasty" },
  first_published_at: "2026-01-05T00:00:00Z",
  last_published_at: "2026-01-05T00:00:00Z",
  reading_time_minutes: 3,
  author_name: "Dr. Author",
  cover: null,
});

const mockBlogHome = (count = 3, lang: "en" | "ar" = "en"): BlogHome => {
  const articles = Array.from({ length: count }, (_, i) => mockSummary(i + 1, lang));
  return {
    featured: articles[0] ?? null,
    articles,
  };
};

describe("useBlogHome hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("generates stable, locale-scoped query keys", () => {
    expect(blogKeys.all).toEqual(["blogs"]);
    expect(blogKeys.home("en")).toEqual(["blogs", "home", "en"]);
    expect(blogKeys.home("ar")).toEqual(["blogs", "home", "ar"]);
  });

  it("loads blog home data for specified locale without initial data", async () => {
    const data = mockBlogHome(3, "en");
    vi.mocked(fetchBlogHome).mockResolvedValueOnce(data);

    const { result } = renderHook(() => useBlogHome("en"), {
      wrapper: createTestWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.home).toBeNull();
    expect(result.current.error).toBe(false);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.home).toEqual(data);
    expect(result.current.error).toBe(false);
    expect(fetchBlogHome).toHaveBeenCalledTimes(1);
    expect(fetchBlogHome).toHaveBeenCalledWith("en", {
      signal: expect.any(AbortSignal),
    });
  });

  it("hydrates immediately when initialHome is provided without mount refetch", () => {
    const initialData = mockBlogHome(4, "en");

    const { result } = renderHook(
      () => useBlogHome("en", { initialHome: initialData }),
      {
        wrapper: createTestWrapper(),
      },
    );

    expect(result.current.home).toEqual(initialData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(false);
    expect(fetchBlogHome).not.toHaveBeenCalled();
  });

  it("does not leak initialHome across locale change and fetches for mismatched locale", async () => {
    const enInitial = mockBlogHome(2, "en");
    const arFetched = mockBlogHome(2, "ar");

    vi.mocked(fetchBlogHome).mockResolvedValueOnce(arFetched);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = createTestWrapper(queryClient);

    const { result, rerender } = renderHook(
      ({ lang }: { lang: string }) =>
        useBlogHome(lang, { initialHome: enInitial }),
      {
        initialProps: { lang: "en" },
        wrapper,
      },
    );

    expect(result.current.home).toEqual(enInitial);
    expect(fetchBlogHome).not.toHaveBeenCalled();

    // Switch locale to Arabic while initialHome is still the English object
    rerender({ lang: "ar" });

    await waitFor(() => expect(result.current.home).toEqual(arFetched));
    expect(fetchBlogHome).toHaveBeenCalledTimes(1);
    expect(fetchBlogHome).toHaveBeenCalledWith("ar", {
      signal: expect.any(AbortSignal),
    });
  });

  it("isolates cache entries per locale without cross-locale leaks and reuses cache", async () => {
    const enData = mockBlogHome(2, "en");
    const arData = mockBlogHome(2, "ar");

    vi.mocked(fetchBlogHome).mockImplementation(async (locale) => {
      if (locale === "ar") return arData;
      return enData;
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = createTestWrapper(queryClient);

    const { result, rerender } = renderHook(
      ({ lang }: { lang: string }) => useBlogHome(lang),
      {
        initialProps: { lang: "en" },
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.home).toEqual(enData));

    // Switch to Arabic
    rerender({ lang: "ar" });
    await waitFor(() => expect(result.current.home).toEqual(arData));

    // Switch back to English — should reuse cache without refetching
    rerender({ lang: "en" });
    expect(result.current.home).toEqual(enData);
    expect(fetchBlogHome).toHaveBeenCalledTimes(2); // once for en, once for ar
  });

  it("sets error to true and home to null on failure without automatic retry", async () => {
    vi.mocked(fetchBlogHome).mockRejectedValueOnce(new Error("Service unavailable"));

    const { result } = renderHook(() => useBlogHome("en"), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.home).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(fetchBlogHome).toHaveBeenCalledTimes(1);
  });

  it("recovers on user-triggered retry after failure", async () => {
    const data = mockBlogHome(3, "en");
    vi.mocked(fetchBlogHome)
      .mockRejectedValueOnce(new Error("Network drop"))
      .mockResolvedValueOnce(data);

    const { result } = renderHook(() => useBlogHome("en"), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.home).toBeNull();

    await act(async () => {
      await result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.error).toBe(false);
      expect(result.current.home).toEqual(data);
    });
    expect(fetchBlogHome).toHaveBeenCalledTimes(2);
  });

  it("restores error state if user retry fails again", async () => {
    vi.mocked(fetchBlogHome)
      .mockRejectedValueOnce(new Error("First failure"))
      .mockRejectedValueOnce(new Error("Second failure"));

    const { result } = renderHook(() => useBlogHome("en"), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBe(true));

    await act(async () => {
      await result.current.retry();
    });

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.home).toBeNull();
    expect(fetchBlogHome).toHaveBeenCalledTimes(2);
  });

  it("aborts in-flight request on unmount", async () => {
    let capturedSignal: AbortSignal | undefined;
    vi.mocked(fetchBlogHome).mockImplementation(async (_locale, options) => {
      capturedSignal = options?.signal;
      return new Promise(() => {}); // never resolves
    });

    const { unmount } = renderHook(() => useBlogHome("en"), {
      wrapper: createTestWrapper(),
    });

    expect(fetchBlogHome).toHaveBeenCalledTimes(1);
    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(false);

    unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });
});
