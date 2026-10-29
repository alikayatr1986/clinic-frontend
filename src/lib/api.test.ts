// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiRequest, isAbortError } from "@/lib/api";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function stubFetch(
  response: Response | ((input: RequestInfo | URL, init?: RequestInit) => Promise<Response>),
) {
  const fetchMock = vi.fn(
    typeof response === "function" ? response : async () => response,
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function hangUntilAborted(
  _input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return new Promise<Response>((_resolve, reject) => {
    const signal = init?.signal;
    if (!signal) return;
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    signal.addEventListener("abort", () => reject(signal.reason), {
      once: true,
    });
  });
}

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("Expected the request to reject");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("apiRequest", () => {
  it("returns the parsed JSON body on success", async () => {
    const body = { data: [{ id: "1" }], total: 1 };
    stubFetch(jsonResponse(body));
    vi.stubEnv("API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    await expect(apiRequest("/api/v1/gallery")).resolves.toEqual(body);
  });

  it("resolves undefined for a 204 response", async () => {
    stubFetch(new Response(null, { status: 204 }));
    vi.stubEnv("API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    await expect(apiRequest("/api/v1/procedures")).resolves.toBeUndefined();
  });

  it("resolves undefined for an empty success body", async () => {
    stubFetch(new Response("", { status: 200 }));
    vi.stubEnv("API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    await expect(apiRequest("/api/v1/procedures")).resolves.toBeUndefined();
  });

  it("throws a typed error carrying status, code, and field names", async () => {
    stubFetch(
      jsonResponse(
        {
          error: {
            code: "validation_failed",
            fields: { email: "invalid", name: "required" },
          },
        },
        400,
      ),
    );
    vi.stubEnv("API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    const error = await captureError(apiRequest("/api/v1/leads"));

    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError.status).toBe(400);
    expect(apiError.code).toBe("validation_failed");
    expect(apiError.fields).toEqual(["email", "name"]);
    expect(apiError.message).toContain("400");
  });

  it("throws an error with empty code and no fields for a non-JSON error", async () => {
    stubFetch(new Response("<html>bad gateway</html>", { status: 502 }));
    vi.stubEnv("API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    const error = await captureError(apiRequest("/api/v1/gallery"));

    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError.status).toBe(502);
    expect(apiError.code).toBe("");
    expect(apiError.fields).toEqual([]);
    expect(apiError.message).toContain("502");
  });

  it("throws an error for an empty error body", async () => {
    stubFetch(new Response("", { status: 500 }));
    vi.stubEnv("API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    const error = await captureError(apiRequest("/api/v1/gallery"));

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
    expect((error as ApiError).fields).toEqual([]);
  });

  it("merges caller headers, JSON body, and query params", async () => {
    const fetchMock = stubFetch(jsonResponse({ data: { id: "lead-1" } }, 201));
    vi.stubGlobal("window", {});
    vi.stubEnv("API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    await apiRequest("/api/v1/leads", {
      method: "POST",
      query: { lang: "ar", page: 2, empty: undefined },
      body: { name: "Sara" },
      headers: { Accept: "application/vnd.api+json", "X-Trace": "abc" },
    });

    const [url, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);

    expect(url).toBe("/api/v1/leads?lang=ar&page=2");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ name: "Sara" }));
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("accept")).toBe("application/vnd.api+json");
    expect(headers.get("x-trace")).toBe("abc");
  });

  it("defaults cache to no-store and passes a caller override through", async () => {
    const fetchMock = stubFetch(async () => jsonResponse({ data: [] }));
    vi.stubGlobal("window", {});
    vi.stubEnv("API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    await apiRequest("/api/v1/gallery");
    await apiRequest("/api/v1/gallery", { cache: "force-cache" });

    expect(fetchMock.mock.calls[0][1]?.cache).toBe("no-store");
    expect(fetchMock.mock.calls[1][1]?.cache).toBe("force-cache");
  });

  it("serializes array query values as commas and omits empty arrays", async () => {
    const fetchMock = stubFetch(jsonResponse({ data: [] }));
    vi.stubGlobal("window", {});
    vi.stubEnv("API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    await apiRequest("/api/v1/gallery-content", {
      query: { image_ids: ["a", "b"], empty: [] },
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/v1/gallery-content?image_ids=a%2Cb",
    );
  });

  it("sends no transport timeout signal when timeoutMs is 0", async () => {
    const fetchMock = stubFetch(jsonResponse({ data: [] }));
    vi.stubGlobal("window", {});
    vi.stubEnv("API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    await expect(
      apiRequest("/api/v1/gallery", { timeoutMs: 0 }),
    ).resolves.toEqual({ data: [] });
    expect(fetchMock.mock.calls[0][1]?.signal).toBeUndefined();
  });

  it("throws a typed error when a successful body is not JSON", async () => {
    stubFetch(new Response("not json", { status: 200 }));
    vi.stubEnv("API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    const error = await captureError(apiRequest("/api/v1/gallery"));

    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError.status).toBe(200);
    expect(apiError.code).toBe("");
    expect(apiError.fields).toEqual([]);
    expect(apiError.cause).toBeInstanceOf(SyntaxError);
  });

  it("aborts and rejects with a timeout error when no response arrives", async () => {
    stubFetch(hangUntilAborted);
    vi.stubEnv("API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    const error = await captureError(
      apiRequest("/api/v1/slow", { timeoutMs: 10 }),
    );

    expect(isAbortError(error)).toBe(true);
    expect(error).not.toBeInstanceOf(ApiError);
  });

  it("honors a caller-provided AbortSignal", async () => {
    const fetchMock = stubFetch(hangUntilAborted);
    vi.stubEnv("API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    const controller = new AbortController();
    const request = apiRequest("/api/v1/slow", {
      signal: controller.signal,
    });
    controller.abort();

    const error = await captureError(request);
    const [, init] = fetchMock.mock.calls[0];

    expect(isAbortError(error)).toBe(true);
    expect(error).not.toBeInstanceOf(ApiError);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(init?.signal).not.toBe(controller.signal);
    expect(init?.signal?.aborted).toBe(true);
  });

  it("keeps browser requests same-origin relative", async () => {
    const fetchMock = stubFetch(jsonResponse({ data: [] }));
    vi.stubGlobal("window", {});
    vi.stubEnv("API_BASE_URL", "https://api.example.test");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://public.example.test");

    await apiRequest("/api/v1/gallery");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/gallery");
  });

  it("prefixes server requests with API_BASE_URL", async () => {
    const fetchMock = stubFetch(jsonResponse({ data: [] }));
    vi.stubEnv("API_BASE_URL", "https://api.example.test/");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    await apiRequest("/api/v1/gallery", { query: { page: 1 } });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.example.test/api/v1/gallery?page=1",
    );
  });

  it("falls back to NEXT_PUBLIC_API_URL then the local API", async () => {
    const fetchMock = stubFetch(async () => jsonResponse({ data: [] }));

    vi.stubEnv("API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://public.example.test");
    await apiRequest("/api/v1/consent");
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://public.example.test/api/v1/consent",
    );

    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    await apiRequest("/api/v1/consent");
    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://127.0.0.1:8080/api/v1/consent",
    );
  });
});
