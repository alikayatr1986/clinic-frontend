import type { ReactNode } from "react";

import type {
  BlogBodyProps,
  BlogMark,
} from "@/features/blogs/types/blogs.types";
import { buildBlogAnchors, safeBlogHref } from "@/features/blogs/utils/blogs.utils";

function renderText(
  text: string,
  marks: readonly BlogMark[] | undefined,
  externalLabel: string,
): ReactNode {
  const chars = Array.from(text); // marks use code-point offsets
  const valid = (marks ?? []).filter((m) => {
    const outside = m.start < 0 || m.end <= m.start || chars.length < m.end;
    return !outside;
  });
  if (valid.length === 0) return text;

  const points = new Set([0, chars.length, ...valid.flatMap((m) => [m.start, m.end])]);
  const cuts = [...points].sort((a, b) => {
    return a - b;
  });
  const out: ReactNode[] = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const [from, to] = [cuts[i], cuts[i + 1]];
    const active = valid.filter((m) => {
          return m.start <= from && m.end >= to;
        });
    let node: ReactNode = chars.slice(from, to).join("");
    if (active.some((m) => m.type === "em")) node = <em>{node}</em>;
    if (active.some((m) => m.type === "strong")) node = <strong>{node}</strong>;
    const link = active.find((m) => m.type === "link");
    const href = link ? safeBlogHref(link.href) : null;
    if (href) {
      const external = !href.startsWith("/");
      node = (
        <a
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="font-semibold text-primary underline underline-offset-4"
        >
          {node}
          {external && <span className="sr-only"> ({externalLabel})</span>}
        </a>
      );
    }
    out.push(<span key={i}>{node}</span>);
  }
  return out;
}

/** Allowlist renderer: unknown block types render nothing; all text is escaped by React. */
export function BlogBody({ blocks, externalLabel }: BlogBodyProps) {
  const { ids } = buildBlogAnchors(blocks);
  return (
    <div className="space-y-6 text-lg leading-8 text-foreground [overflow-wrap:anywhere]">
      {blocks.map((b, i) => {
        const inline = renderText(b.text ?? "", b.marks, externalLabel);
        switch (b.type) {
          case "paragraph":
            return <p key={i}>{inline}</p>;
          case "heading": {
            const id = ids.get(i);
            return b.level === 3 ? (
              <h3 key={i} id={id} className="scroll-mt-24 pt-4 text-xl font-bold lg:scroll-mt-28">
                {inline}
              </h3>
            ) : (
              <h2 key={i} id={id} className="scroll-mt-24 pt-6 text-2xl font-bold lg:scroll-mt-28">
                {inline}
              </h2>
            );
          }
          case "blockquote":
            return (
              <blockquote
                key={i}
                className="border-s-4 border-primary/40 ps-5 italic text-muted-foreground"
              >
                {inline}
              </blockquote>
            );
          case "list": {
            const items = (b.items ?? []).map((item, j) => <li key={j}>{item}</li>);
            return b.style === "ordered" ? (
              <ol key={i} className="list-decimal space-y-2 ps-6">
                {items}
              </ol>
            ) : (
              <ul key={i} className="list-disc space-y-2 ps-6">
                {items}
              </ul>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
