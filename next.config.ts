import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Links `src/i18n/request.ts` to next-intl's server runtime (auto-detected
// at the default `src/i18n/request.ts` path). Until server components start
// using next-intl this wrapper is inert.
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
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
