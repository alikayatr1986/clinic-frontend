import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/features/blogs/utils/blogs-metadata.utils";

// Authentication stays the privacy boundary; this only keeps crawlers out of admin routes.
export default function robots(): MetadataRoute.Robots {
  const sitemap = absoluteUrl("/sitemap.xml");
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/admin/"] },
    ...(sitemap && { sitemap }),
  };
}
