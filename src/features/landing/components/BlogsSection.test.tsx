import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";

import { BlogsSection } from "./BlogsSection";
import { axePass, themedRender } from "@/test/utils";
import type { BlogHome, BlogSummary } from "@/features/blogs/types/blogs.types";
import enMessages from "../../../../messages/en.json";

function post(n: number): BlogSummary {
  return {
    id: `id-${n}`,
    slug: `post-${n}`,
    lang: "en",
    title: `Post ${n}`,
    excerpt: `Excerpt ${n}`,
    category: { key: "rhinoplasty", label: "Rhinoplasty" },
    first_published_at: "2026-01-05T23:30:00Z",
    last_published_at: "2026-01-05T23:30:00Z",
    reading_time_minutes: 3,
    author_name: "Author",
    cover: null,
  };
}

function home(count: number): BlogHome {
  const articles = Array.from({ length: count }, (_, i) => post(i + 1));
  return { featured: articles[0] ?? null, articles };
}

function setDesktop(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("BlogsSection", () => {
  it("desktop: pages three at a time with disabled ends and passive indicators", async () => {
    setDesktop(true);
    const { container } = themedRender(<BlogsSection initialHome={home(12)} />);

    expect(document.querySelectorAll("#blog")).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: /^Post / })).toHaveLength(3);
    expect(screen.getAllByTestId("blogs-indicator")).toHaveLength(4);
    expect(screen.getByRole("button", { name: enMessages.blogs.previous })).toBeDisabled();
    expect(screen.getAllByText("Jan 5, 2026", { selector: "time" })).toHaveLength(3);

    const next = screen.getByRole("button", { name: enMessages.blogs.next });
    await userEvent.click(next);
    expect(screen.getByRole("link", { name: "Post 4" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Post 1" })).not.toBeInTheDocument();
    for (let i = 0; i < 3; i++) await userEvent.click(next);
    expect(next).toBeDisabled();
    expect(screen.getByRole("link", { name: "Post 12" })).toBeInTheDocument();

    await axePass(container);
  });

  it("desktop: hides controls when one page suffices", () => {
    setDesktop(true);
    themedRender(<BlogsSection initialHome={home(3)} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("blogs-indicator")).toHaveLength(0);
  });

  it("mobile: featured plus latest rows without duplicates or carousel", async () => {
    setDesktop(false);
    const { container } = themedRender(<BlogsSection initialHome={home(6)} />);
    const titles = screen.getAllByRole("link", { name: /^Post / }).map((l) => l.textContent);
    expect(titles).toEqual(["Post 1", "Post 2", "Post 3", "Post 4"]);
    expect(screen.getByText(enMessages.blogs.latest)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    await axePass(container);
  });

  it("mobile: a single post has no Latest Articles heading", () => {
    setDesktop(false);
    themedRender(<BlogsSection initialHome={home(1)} />);
    expect(screen.queryByText(enMessages.blogs.latest)).not.toBeInTheDocument();
  });

  it("empty library keeps #blog with coming-soon copy", () => {
    setDesktop(true);
    themedRender(<BlogsSection initialHome={home(0)} />);
    expect(screen.getByTestId("blogs-empty")).toHaveTextContent(enMessages.blogs.empty);
    expect(screen.getByRole("link", { name: enMessages.blogs.viewAllArticles })).toHaveAttribute(
      "href",
      "/blog",
    );
  });

  it("failure shows retry, not the empty state", async () => {
    setDesktop(true);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    themedRender(<BlogsSection />);
    expect(await screen.findByRole("alert")).toHaveTextContent(enMessages.blogs.errorTitle);
    expect(screen.queryByTestId("blogs-empty")).not.toBeInTheDocument();
  });
});
