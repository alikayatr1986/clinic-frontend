import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { BlogArticle } from "./BlogArticle";
import { BlogBody } from "./BlogBody";
import { axePass, themedRender } from "@/test/utils";
import type { BlogBlock, BlogDetail } from "@/features/blogs/types/blogs.types";
import { buildBlogAnchors, safeBlogHref } from "@/features/blogs/utils/blogs.utils";
import enMessages from "../../../../messages/en.json";

const blocks: BlogBlock[] = [
  { type: "paragraph", text: "Hello 😀 world", marks: [{ type: "strong", start: 6, end: 7 }] },
  { type: "heading", level: 2, text: "One", anchor: "same" },
  { type: "heading", level: 2, text: "Two", anchor: "same" },
  { type: "heading", level: 3, text: "Three", anchor: "x y!" },
  { type: "list", style: "ordered", items: ["a", "b"] },
  { type: "blockquote", text: "quote" },
];

const post: BlogDetail = {
  id: "1",
  slug: "s",
  lang: "en",
  title: "The Title",
  excerpt: "Excerpt",
  category: { key: "rhinoplasty", label: "Rhinoplasty" },
  first_published_at: "2026-01-05T00:00:00Z",
  last_published_at: "2026-02-05T00:00:00Z",
  reading_time_minutes: 4,
  author_name: "Dr A",
  body: { schema_version: 1, blocks },
  references: [
    { label: "Good ref", url: "https://example.com/x" },
    { label: "Bad ref", url: "javascript:alert(1)" },
  ],
  related_articles: [],
};

describe("safeBlogHref", () => {
  it.each(["javascript:alert(1)", "data:text/html,x", "//evil.com", "http://a.com", "https://u:p@a.com", "/\\evil"])(
    "rejects %s",
    (h) => expect(safeBlogHref(h)).toBeNull(),
  );
  it("allows https and root paths", () => {
    expect(safeBlogHref("https://a.com/x")).toBe("https://a.com/x");
    expect(safeBlogHref("/#contact")).toBe("/#contact");
  });
});

describe("BlogBody", () => {
  it("escapes text and drops unsafe links and unknown blocks", () => {
    const hostile: BlogBlock[] = [
      {
        type: "paragraph",
        text: "<script>alert(1)</script> click",
        marks: [{ type: "link", start: 26, end: 31, href: "javascript:alert(1)" }],
      },
      { type: "script" } as unknown as BlogBlock,
    ];
    const { container } = themedRender(<BlogBody blocks={hostile} externalLabel="ext" />);
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    expect(container).toHaveTextContent("<script>alert(1)</script> click");
  });

  it("applies marks by code point offsets and opens https links safely", () => {
    const { container } = themedRender(
      <BlogBody
        externalLabel="ext"
        blocks={[
          ...blocks.slice(0, 1),
          { type: "paragraph", text: "go", marks: [{ type: "link", start: 0, end: 2, href: "https://a.com" }] },
        ]}
      />,
    );
    expect(container.querySelector("strong")?.textContent).toBe("😀");
    const a = container.querySelector("a");
    expect(a).toHaveAttribute("rel", "noopener noreferrer");
    expect(a).toHaveAttribute("target", "_blank");
  });

  it("produces unique prefixed heading ids", () => {
    const { ids } = buildBlogAnchors(blocks);
    expect([...ids.values()]).toEqual(["section-same", "section-same-2", "section-x-y"]);
  });
});

describe("BlogArticle", () => {
  it("renders one H1, attribution, contents, safe references and notice", async () => {
    const { container } = themedRender(<BlogArticle post={post} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText("By Dr A")).toBeInTheDocument();
    expect(screen.getByText("4 min read")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Good ref/ })).toBeInTheDocument();
    expect(screen.queryByText("Bad ref")).not.toBeInTheDocument();
    expect(screen.getByText(enMessages.blogs.notice)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: enMessages.blogs.consultation })).toHaveAttribute(
      "href",
      "/#contact",
    );
    expect(screen.queryByText(enMessages.blogs.related)).not.toBeInTheDocument();
    await axePass(container);
  });

  it("omits contents under three headings and missing reviewer", () => {
    themedRender(
      <BlogArticle post={{ ...post, body: { schema_version: 1, blocks: blocks.slice(0, 2) } }} />,
    );
    expect(screen.queryByText(enMessages.blogs.contents)).not.toBeInTheDocument();
    expect(screen.queryByText(/Reviewed by/)).not.toBeInTheDocument();
  });
});
