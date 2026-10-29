import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Links `src/i18n/request.ts` to next-intl's server runtime (auto-detected
// at the default `src/i18n/request.ts` path). Until server components start
// using next-intl this wrapper is inert.
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // The local rewrite probe gets its own disposable build directory so it can
  // run beside a developer's Next process without changing their .next files.
  distDir: process.env.GALLERY_REWRITE_VERIFY_DIST_DIR || ".next",
  async rewrites() {
    // Browser gallery reads and derivative bytes must use the same-origin Go
    // eligibility gate. Keep this origin server-only; never expose credentials.
    const apiOrigin = (process.env.API_BASE_URL || "http://127.0.0.1:8080").replace(/\/$/, "");
    return [
      { source: "/api/v1/consent", destination: `${apiOrigin}/api/v1/consent` },
      { source: "/api/v1/leads", destination: `${apiOrigin}/api/v1/leads` },
      { source: "/api/v1/procedures", destination: `${apiOrigin}/api/v1/procedures` },
      {
        source: "/api/v1/gallery/:path*",
        destination: `${apiOrigin}/api/v1/gallery/:path*`,
      },
      {
        source: "/api/v1/blogs/:path*",
        destination: `${apiOrigin}/api/v1/blogs/:path*`,
      },
      {
        source: "/api/v1/gallery-content",
        destination: `${apiOrigin}/api/v1/gallery-content`,
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
