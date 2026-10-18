import { NextRequest, type NextResponse as NextResponseType } from "next/server";
import { describe, expect, it } from "vitest";

import { config, proxy } from "./proxy";

type RequestOptions = {
  acceptLanguage?: string;
  secFetchDest?: string;
  cookie?: string;
};

function makeRequest(
  path: string,
  { acceptLanguage, secFetchDest, cookie }: RequestOptions = {},
): NextRequest {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  if (secFetchDest) headers.set("sec-fetch-dest", secFetchDest);
  if (acceptLanguage) headers.set("accept-language", acceptLanguage);

  return new NextRequest(`http://localhost${path}`, { headers });
}

function forwardedLocale(response: NextResponseType): string | null {
  return response.headers.get("x-middleware-request-x-next-intl-locale");
}

function setLocaleCookies(response: NextResponseType): Array<{
  name: string;
  value: string;
  maxAge: number | undefined;
  path: string | undefined;
  sameSite: string | boolean | undefined;
}> {
  return response.cookies
    .getAll()
    .filter((cookie) => cookie.name === "NEXT_LOCALE")
    .map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      maxAge: cookie.maxAge,
      path: cookie.path,
      sameSite: cookie.sameSite,
    }));
}

describe("locale resolution proxy", () => {
  it("passes through a document request with a supported cookie: header set, no cookie write", () => {
    const response = proxy(
      makeRequest("/", { cookie: "NEXT_LOCALE=ar", secFetchDest: "document" }),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(forwardedLocale(response)).toBe("ar");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("silently falls back to the default locale for an unsupported cookie value and refreshes the stale cookie", () => {
    const response = proxy(
      makeRequest("/", { cookie: "NEXT_LOCALE=xx", secFetchDest: "document" }),
    );

    expect(forwardedLocale(response)).toBe("en");

    const cookies = setLocaleCookies(response);
    expect(cookies).toHaveLength(1);
    expect(cookies[0].value).toBe("en");
  });

  it("persists the cookie on a first visit with an Arabic Accept-Language without changing the URL", () => {
    const response = proxy(
      makeRequest("/", {
        acceptLanguage: "ar-SA,ar;q=0.9",
        secFetchDest: "document",
      }),
    );

    expect(forwardedLocale(response)).toBe("ar");

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(response.headers.get("location")).toBeNull();

    const cookies = setLocaleCookies(response);
    expect(cookies).toHaveLength(1);

    expect(cookies[0]).toEqual({
      name: "NEXT_LOCALE",
      value: "ar",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
  });

  it("persists the default locale for an unsupported browser Accept-Language", () => {
    const response = proxy(
      makeRequest("/", {
        acceptLanguage: "de-DE,de",
        secFetchDest: "document",
      }),
    );

    expect(forwardedLocale(response)).toBe("en");
    const cookies = setLocaleCookies(response);
    expect(cookies).toHaveLength(1);
    expect(cookies[0].value).toBe("en");
  });

  it("responds 404 to locale-prefixed pathnames without redirect or rewrite", () => {
    for (const path of [
      "/en",
      "/en/",
      "/en/sign-in",
      "/EN/sign-in",
      "/ar/blog/post",
      "/ar/x/y",
    ]) {
      const response = proxy(makeRequest(path, { secFetchDest: "document" }));

      expect(response.status).toBe(404);
      expect(response.headers.get("cache-control")).toBe("no-store");

      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("x-middleware-rewrite")).toBeNull();
      expect(response.headers.get("x-middleware-next")).toBeNull();
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(forwardedLocale(response)).toBeNull();
    }
  });

  it("prefers the cookie over Accept-Language and leaves it untouched on match", () => {
    const response = proxy(
      makeRequest("/", {
        acceptLanguage: "de-DE,de",
        cookie: "NEXT_LOCALE=ar",
        secFetchDest: "document",
      }),
    );

    expect(forwardedLocale(response)).toBe("ar");
    expect(setLocaleCookies(response)).toEqual([]);
  });

  it("resolves an uppercase cookie value and rewrites it to the canonical lowercase value", () => {
    const response = proxy(
      makeRequest("/", { cookie: "NEXT_LOCALE=AR", secFetchDest: "document" }),
    );

    expect(forwardedLocale(response)).toBe("ar");
    const cookies = setLocaleCookies(response);
    expect(cookies).toHaveLength(1);
    expect(cookies[0].value).toBe("ar");
  });

  it("falls back to the default locale for a wildcard-only Accept-Language", () => {
    const response = proxy(
      makeRequest("/", { acceptLanguage: "*", secFetchDest: "document" }),
    );

    expect(forwardedLocale(response)).toBe("en");
    const cookies = setLocaleCookies(response);
    expect(cookies).toHaveLength(1);
    expect(cookies[0].value).toBe("en");
  });

  it("breaks q ties deterministically by preserving Accept-Language header order", () => {
    for (const [header, expected] of [
      ["en-US;q=0.8,ar;q=0.8", "en"],
      ["ar;q=0.8,en-US;q=0.8", "ar"],
    ] as const) {
      const response = proxy(
        makeRequest("/", { acceptLanguage: header, secFetchDest: "document" }),
      );

      expect(forwardedLocale(response)).toBe(expected);
    }
  });

  it("obeys document semantics for a capitalized sec-fetch-dest value", () => {
    const response = proxy(
      makeRequest("/", { cookie: "NEXT_LOCALE=ar", secFetchDest: "Document" }),
    );

    expect(forwardedLocale(response)).toBe("ar");
    expect(setLocaleCookies(response)).toEqual([]);
  });

  it("sets the header but skips the cookie write for non-document background requests", () => {
    const response = proxy(
      makeRequest("/", { cookie: "NEXT_LOCALE=ar", secFetchDest: "prefetch" }),
    );

    expect(forwardedLocale(response)).toBe("ar");
    expect(setLocaleCookies(response)).toEqual([]);

    const stale = proxy(
      makeRequest("/", { cookie: "NEXT_LOCALE=xx", secFetchDest: "prefetch" }),
    );
    expect(forwardedLocale(stale)).toBe("en");
    expect(setLocaleCookies(stale)).toEqual([]);
  });

  it("treats a missing sec-fetch-dest header (curl, server-to-server) as a document navigation", () => {
    const response = proxy(makeRequest("/"));

    expect(forwardedLocale(response)).toBe("en");
    expect(setLocaleCookies(response)).toHaveLength(1);
  });
});

describe("proxy matcher", () => {

  const matcher = new RegExp(`^${config.matcher}$`);

  it("covers the unprefixed pages", () => {
    expect(matcher.test("/")).toBe(true);
    expect(matcher.test("/sign-in")).toBe(true);
  });

  it("excludes api, _next, _vercel and dot-file/static assets", () => {
    expect(matcher.test("/api/health")).toBe(false);
    expect(matcher.test("/_next/static/chunk.js")).toBe(false);
    expect(matcher.test("/_vercel/insights/view")).toBe(false);
    expect(matcher.test("/favicon.ico")).toBe(false);
    expect(matcher.test("/robots.txt")).toBe(false);
  });
});
