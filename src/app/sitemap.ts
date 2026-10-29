import type { MetadataRoute } from "next";
import { connection } from "next/server";

import { fetchBlogSitemap } from "@/features/blogs/services/blogs.service";
import {
  absoluteUrl,
  articlePath,
} from "@/features/blogs/utils/blogs-metadata.utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Opt out of build-time prerendering: entries must reflect live publications.
  await connection();
  const list = absoluteUrl("/blog");
  if (!list) return [];

  const entries = await fetchBlogSitemap();
  return [
    { url: list },
    ...entries.flatMap((e) => {
      const url = absoluteUrl(articlePath(e.slug));
      return url ? [{ url, lastModified: new Date(e.last_published_at) }] : [];
    }),
  ];
}
