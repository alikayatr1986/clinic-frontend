export interface BlogCover {
  url: string;
  alt: string;
  width: number;
  height: number;
  focal_point: { x: number; y: number };
}

export interface BlogSummary {
  id: string;
  slug: string;
  lang: "en" | "ar";
  title: string;
  excerpt: string;
  category: { key: string; label: string };
  first_published_at: string;
  last_published_at: string;
  reading_time_minutes: number;
  author_name: string;
  cover?: BlogCover | null;
}

export interface BlogMark {
  type: "strong" | "em" | "link";
  /** Rune (code point) offsets into the block text, end exclusive. */
  start: number;
  end: number;
  href?: string;
}

export interface BlogBlock {
  type: "paragraph" | "heading" | "list" | "blockquote";
  level?: 2 | 3;
  style?: "ordered" | "unordered";
  text?: string;
  anchor?: string;
  items?: string[];
  marks?: BlogMark[];
}

export interface BlogReference {
  label: string;
  url: string;
  source_id?: string;
}

export interface BlogDetail extends BlogSummary {
  reviewer_attribution?: string | null;
  body: { schema_version: number; blocks: BlogBlock[] };
  seo_title?: string;
  seo_description?: string;
  references: BlogReference[];
  related_articles: BlogSummary[];
}

export interface BlogCategory {
  key: string;
  label: string;
  count?: number;
}

export interface BlogListQuery {
  lang: string;
  page: number;
  pageSize: number;
  category?: string;
  q?: string;
}

export interface BlogList {
  data: BlogSummary[];
  total: number;
}

export interface BlogHome {
  featured: BlogSummary | null;
  articles: BlogSummary[];
}

export interface BlogBodyProps {
  blocks: readonly BlogBlock[];
  externalLabel: string;
}

export interface BlogCardProps {
  post: BlogSummary;
  locale: string;
  readMoreLabel: string;
  /** Cover aspect: desktop card (4:3) or wide featured (mobile). */
  coverClassName?: string;
  showReadMore?: boolean;
  className?: string;
  headingLevel?: "h2" | "h3";
}

export interface BlogCoverProps {
  cover?: BlogCover | null;
  className?: string;
}

export interface BlogListProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export interface BlogRowProps {
  post: BlogSummary;
  locale: string;
}

export interface BlogArticleProps {
  post: BlogDetail;
}

export interface BlogPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export interface BlogSlugPageProps {
  params: Promise<{ slug: string }>;
}

export interface BlogErrorProps {
  error: Error;
  reset: () => void;
}

