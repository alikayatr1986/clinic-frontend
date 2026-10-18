import { routing } from "@/i18n/routing";

export const LOCALE_COOKIE = (() => {
  const localeCookie =
    typeof routing.localeCookie === "object" && routing.localeCookie !== null
      ? routing.localeCookie
      : undefined;
  return {
    name: "NEXT_LOCALE",
    path: "/",
    sameSite: "lax",
    maxAge: localeCookie?.maxAge ?? 60 * 60 * 24 * 365,
  };
})();

export const SUPPORTED_LOCALES = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" },
] as const;
