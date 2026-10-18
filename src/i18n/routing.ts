import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: [
    "en",
    "ar",
    // "ru",
  ],
  defaultLocale: "en",
  localePrefix: "never",
  localeCookie: {
    maxAge: 60 * 60 * 24 * 365,
  },
});
