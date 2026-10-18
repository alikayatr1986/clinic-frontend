import { NextResponse, type NextRequest } from "next/server";
import { hasLocale } from "next-intl";

import { routing } from "@/i18n/routing";

const HEADER_LOCALE_NAME = "X-NEXT-INTL-LOCALE";

const DEFAULT_COOKIE_NAME = "NEXT_LOCALE";
const DEFAULT_COOKIE_ATTRIBUTES = { path: "/", sameSite: "lax" as const };

const LOCALE_COOKIE = (() => {
  const localeCookie =
    typeof routing.localeCookie === "object" && routing.localeCookie !== null
      ? routing.localeCookie
      : {};
  const { name: customName, ...attributes } = localeCookie;
  return {
    name: customName ?? DEFAULT_COOKIE_NAME,
    attributes: { ...DEFAULT_COOKIE_ATTRIBUTES, ...attributes },
  };
})();

type ResolvedLocale = (typeof routing.locales)[number];

function matchAcceptLanguage(
  header: string | null,
): ResolvedLocale | undefined {
  if (!header) return undefined;

  const candidates = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((param) =>
        param.trim().toLowerCase().startsWith("q="),
      );
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return { q: Number.isFinite(q) ? q : 1, tag: tag.trim().toLowerCase() };
    })
    .filter(({ q, tag }) => tag !== "" && q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of candidates) {
    const exact = routing.locales.find(
      (locale) => locale.toLowerCase() === tag,
    );
    if (exact) return exact;

    const [primary] = tag.split("-");
    const byPrimary = routing.locales.find(
      (locale) => locale.toLowerCase().split("-")[0] === primary,
    );
    if (byPrimary) return byPrimary;
  }

  return undefined;
}

function resolveLocale(request: NextRequest): ResolvedLocale {
  if (request.cookies.has(LOCALE_COOKIE.name)) {
    const cookieValue = request.cookies
      .get(LOCALE_COOKIE.name)
      ?.value?.toLowerCase();
    return hasLocale(routing.locales, cookieValue)
      ? cookieValue
      : routing.defaultLocale;
  }

  return (
    matchAcceptLanguage(request.headers.get("accept-language")) ??
    routing.defaultLocale
  );
}

function isLocalePrefixed(pathname: string): boolean {
  const [firstSegment] = pathname.slice(1).split("/");
  if (!firstSegment) return false;
  return routing.locales.some(
    (locale) => locale.toLowerCase() === firstSegment.toLowerCase(),
  );
}

function syncLocaleCookie(
  request: NextRequest,
  response: NextResponse,
  locale: ResolvedLocale,
): void {
  const secFetchDest = request.headers.get("sec-fetch-dest")?.toLowerCase();
  if (secFetchDest != null && secFetchDest !== "document") return;

  const hasLocaleCookie = request.cookies.has(LOCALE_COOKIE.name);
  if (
    hasLocaleCookie &&
    request.cookies.get(LOCALE_COOKIE.name)?.value === locale
  ) {
    return;
  }

  response.cookies.set({
    ...LOCALE_COOKIE.attributes,
    name: LOCALE_COOKIE.name,
    value: locale,
  });
}

export function proxy(request: NextRequest): NextResponse {
  if (isLocalePrefixed(request.nextUrl.pathname)) {
    return new NextResponse(null, {
      status: 404,
      headers: { "cache-control": "no-store" },
    });
  }

  const locale = resolveLocale(request);

  const headers = new Headers(request.headers);
  headers.set(HEADER_LOCALE_NAME, locale);
  const response = NextResponse.next({ request: { headers } });

  syncLocaleCookie(request, response, locale);
  return response;
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
