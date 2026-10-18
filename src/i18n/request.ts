import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import enMessages from "../../messages/en.json";
import arMessages from "../../messages/ar.json";

export function withFallback<T extends object>(base: T, override: T): T {
  const merged: Record<string, unknown> = { ...base } as Record<
    string,
    unknown
  >;
  for (const [key, overrideValue] of Object.entries(override)) {
    const baseValue = merged[key];
    merged[key] =
      overrideValue !== null &&
      typeof overrideValue === "object" &&
      !Array.isArray(overrideValue) &&
      baseValue !== null &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
        ? withFallback(baseValue as object, overrideValue as object)
        : overrideValue === ""
          ? baseValue
          : overrideValue;
  }
  return merged as T;
}

const MESSAGES: Record<(typeof routing.locales)[number], typeof enMessages> = {
  en: enMessages,
  ar: withFallback(enMessages, arMessages),
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return { locale, messages: MESSAGES[locale] };
});
