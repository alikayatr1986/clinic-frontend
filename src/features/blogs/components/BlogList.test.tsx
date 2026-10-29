import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createTranslator } from "next-intl";

import enMessages from "../../../../messages/en.json";
import { axePass, themedRender } from "@/test/utils";
import type { BlogSummary } from "@/features/blogs/types/blogs.types";

vi.mock("next-intl/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next-intl/server")>()),
  getLocale: vi.fn().mockResolvedValue("en"),
  getTranslations: vi.fn(async (ns: string) =>
    createTranslator({ locale: "en", messages: enMessages, namespace: ns as "blogs" }),
  ),
}));
vi.mock("@/features/blogs/services/blogs.service", () => ({
  fetchBlogCategories: vi.fn(),
  fetchBlogList: vi.fn(),
}));

import { BlogList } from "./BlogList";
import { fetchBlogCategories, fetchBlogList } from "@/features/blogs/services/blogs.service";
import { blogListHref, parseBlogFilters } from "@/features/blogs/utils/blogs.utils";

const post = (n: number): BlogSummary => ({
  id: `id-${n}`,
  slug: `post-${n}`,
  lang: "en",
  title: `Post ${n}`,
  excerpt: "x",
  category: { key: "rhinoplasty", label: "Rhinoplasty" },
  first_published_at: "2026-01-05T00:00:00Z",
  last_published_at: "2026-01-05T00:00:00Z",
  reading_time_minutes: 2,
  author_name: "A",
});

async function renderList(params: Record<string, string>) {
  const ui = await BlogList({ searchParams: Promise.resolve(params) });
  return themedRender(ui);
}

beforeEach(() => {
  vi.mocked(fetchBlogCategories).mockResolvedValue([{ key: "rhinoplasty", label: "Rhinoplasty" }]);
});

describe("parseBlogFilters / blogListHref", () => {
  it("normalizes unsafe input", () => {
    expect(parseBlogFilters({ q: "  a   b ", category: "nope", page: "-3" }, ["x"])).toEqual({
      q: "a b",
      category: "",
      page: 1,
    });
    expect(parseBlogFilters({ category: "x", page: "2" }, ["x"])).toMatchObject({
      category: "x",
      page: 2,
    });
  });
  it("round-trips and omits defaults", () => {
    expect(blogListHref({})).toBe("/blog");
    expect(blogListHref({ q: "a b", category: "x", page: 2 })).toBe("/blog?q=a+b&category=x&page=2");
  });
});

describe("BlogList", () => {
  it("renders results, count and category links", async () => {
    vi.mocked(fetchBlogList).mockResolvedValue({ data: [post(1), post(2)], total: 2 });
    const { container } = await renderList({});
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /^Post / })).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent("Articles found: 2");
    expect(screen.getByRole("link", { name: "Rhinoplasty" })).toHaveAttribute(
      "href",
      "/blog?category=rhinoplasty",
    );
    await axePass(container);
  });

  it("shows no-match with clear filters when filtered", async () => {
    vi.mocked(fetchBlogList).mockResolvedValue({ data: [], total: 0 });
    await renderList({ q: "zzz" });
    expect(screen.getByText(enMessages.blogs.noResultsTitle)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: enMessages.blogs.clearFilters })).toHaveAttribute(
      "href",
      "/blog",
    );
  });

  it("shows coming soon for an empty library", async () => {
    vi.mocked(fetchBlogList).mockResolvedValue({ data: [], total: 0 });
    await renderList({});
    expect(screen.getByText(enMessages.blogs.empty)).toBeInTheDocument();
    expect(screen.queryByText(enMessages.blogs.clearFilters)).not.toBeInTheDocument();
  });

  it("offers recovery for an out-of-range page", async () => {
    vi.mocked(fetchBlogList).mockResolvedValue({ data: [], total: 5 });
    await renderList({ page: "9", q: "a" });
    expect(screen.getByRole("link", { name: enMessages.blogs.backToFirstPage })).toHaveAttribute(
      "href",
      "/blog?q=a",
    );
  });

  it("paginates with real prev/next links", async () => {
    vi.mocked(fetchBlogList).mockResolvedValue({ data: [post(1)], total: 30 });
    await renderList({ page: "2" });
    expect(screen.getByRole("link", { name: /Previous page/ })).toHaveAttribute("href", "/blog");
    expect(screen.getByRole("link", { name: /Next page/ })).toHaveAttribute("href", "/blog?page=3");
  });

  it("retains active filters and pagination metadata on shared button anchors", async () => {
    vi.mocked(fetchBlogList).mockResolvedValue({ data: [post(1)], total: 30 });
    const { container } = await renderList({ page: "2", category: "rhinoplasty", q: "nose" });
    const category = screen.getByRole("link", { name: "Rhinoplasty" });
    expect(category).toHaveAttribute("href", "/blog?q=nose&category=rhinoplasty");
    expect(category).toHaveAttribute("aria-current", "true");
    expect(category).toHaveAttribute("data-slot", "button");
    const previous = screen.getByRole("link", { name: /Previous page/ });
    const next = screen.getByRole("link", { name: /Next page/ });
    expect(previous).toHaveAttribute("href", "/blog?q=nose&category=rhinoplasty");
    expect(previous).toHaveAttribute("rel", "prev");
    expect(next).toHaveAttribute("href", "/blog?q=nose&category=rhinoplasty&page=3");
    expect(next).toHaveAttribute("rel", "next");
    expect(next).toHaveAttribute("data-slot", "button");
    expect(container.querySelector("a button, button a")).toBeNull();
  });

  it("propagates API failure instead of rendering empty", async () => {
    vi.mocked(fetchBlogList).mockRejectedValue(new Error("503"));
    await expect(BlogList({ searchParams: Promise.resolve({}) })).rejects.toThrow("503");
  });
});
