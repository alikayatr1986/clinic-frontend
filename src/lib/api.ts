/**
 * Shared HTTP transport for the Go API.
 *
 * Feature services should reach the API through `apiRequest` so base URL
 * resolution, headers, JSON parsing, typed errors, timeouts, and cancellation
 * stay consistent. Feature consumers are migrated onto this boundary
 * incrementally; some still call `fetch` directly in this story.
 *
 * Browser requests stay same-origin relative so `next.config.ts` rewrites can
 * forward them to the API. Server requests resolve an absolute base URL from
 * server-only environment values.
 */

/** Scalar values accepted in a query string. `null`/`undefined` are omitted. */
export type ApiQueryValue = string | number | boolean | null | undefined;

/** Query parameters; arrays are serialized as comma-separated values. */
export type ApiQuery = Record<string, ApiQueryValue | readonly ApiQueryValue[]>;

export interface ApiRequestOptions {
  /** HTTP method. Defaults to `GET`. */
  method?: string;
  /** Query parameters appended to the request URL. */
  query?: ApiQuery;
  /** JSON request body. Strings are sent as-is. */
  body?: unknown;
  /** Extra request headers. Caller values win over the transport defaults. */
  headers?: HeadersInit;
  /** Caller cancellation, composed with the transport timeout. */
  signal?: AbortSignal;
  /** Bounded timeout in milliseconds. `0` disables the transport timeout. */
  timeoutMs?: number;
  /** `fetch` cache mode. Defaults to `no-store`, matching existing services. */
  cache?: RequestCache;
}

/** Default bounded timeout for a single API request. */
export const DEFAULT_TIMEOUT_MS = 15_000;

const DEFAULT_BASE_URL = "http://127.0.0.1:8080";

/**
 * Typed transport failure for HTTP error responses and unparseable success
 * bodies.
 *
 * Carries the HTTP status plus the API error envelope
 * `{ error: { code, fields } }`. `code` is an empty string and `fields` is
 * empty when the response body is missing or not JSON.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: string[];

  constructor(
    status: number,
    code = "",
    fields: string[] = [],
    cause?: unknown,
  ) {
    super(
      `API request failed with status ${status}${code ? ` (${code})` : ""}`,
      { cause },
    );
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/** True for caller cancellation (`AbortError`) and transport timeouts. */
export function isAbortError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const name = (error as { name?: unknown }).name;
  return name === "AbortError" || name === "TimeoutError";
}

function resolveBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Same-origin: the Next.js rewrite forwards `/api/v1/*` to the API.
    return "";
  }
  const baseUrl =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_BASE_URL;
  return baseUrl.replace(/\/$/, "");
}

function buildQueryString(query?: ApiQuery): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      const items = value.filter(
        (item): item is Exclude<ApiQueryValue, null | undefined> =>
          item !== undefined && item !== null,
      );
      if (items.length > 0) params.set(key, items.join(","));
      continue;
    }
    params.set(key, String(value));
  }
  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function parseErrorPayload(body: string): { code: string; fields: string[] } {
  if (!body) return { code: "", fields: [] };
  try {
    const parsed = JSON.parse(body) as {
      error?: { code?: unknown; fields?: unknown };
    };
    const code =
      typeof parsed?.error?.code === "string" ? parsed.error.code : "";
    const rawFields = parsed?.error?.fields;
    let fields: string[] = [];
    if (Array.isArray(rawFields)) {
      fields = rawFields.filter(
        (field): field is string => typeof field === "string",
      );
    } else if (rawFields && typeof rawFields === "object") {
      fields = Object.keys(rawFields);
    }
    return { code, fields };
  } catch {
    return { code: "", fields: [] };
  }
}

interface ComposedSignal {
  signal: AbortSignal | undefined;
  dispose: () => void;
}

/**
 * Compose caller cancellation with one bounded timeout.
 *
 * Uses a single `AbortController` and `setTimeout` instead of
 * `AbortSignal.any`, so older Safari releases (16.4+) keep working. The timer
 * is released by `dispose` as soon as the request settles.
 */
function composeSignal(
  callerSignal: AbortSignal | undefined,
  timeoutMs: number,
): ComposedSignal {
  if (!callerSignal && timeoutMs <= 0) {
    return { signal: undefined, dispose: () => {} };
  }

  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(callerSignal?.reason);

  if (callerSignal) {
    if (callerSignal.aborted) abortFromCaller();
    else callerSignal.addEventListener("abort", abortFromCaller, { once: true });
  }

  const timer =
    timeoutMs > 0
      ? setTimeout(() => {
          controller.abort(
            new DOMException("API request timed out", "TimeoutError"),
          );
        }, timeoutMs)
      : undefined;

  return {
    signal: controller.signal,
    dispose: () => {
      if (timer !== undefined) clearTimeout(timer);
      callerSignal?.removeEventListener("abort", abortFromCaller);
    },
  };
}

/**
 * Perform a typed JSON request against the API.
 *
 * Resolves with the parsed response body (`undefined` for empty/204/205
 * responses) and throws {@link ApiError} for non-2xx responses or a success body
 * that is not JSON. Abort errors
 * (`AbortError` for caller cancellation, `TimeoutError` for the bounded
 * timeout) propagate unchanged so callers can distinguish cancellation.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    query,
    body,
    headers: callerHeaders,
    signal: callerSignal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    cache = "no-store",
  } = options;

  const headers = new Headers({ Accept: "application/json" });
  if (callerHeaders) {
    new Headers(callerHeaders).forEach((value, key) => headers.set(key, value));
  }

  let requestBody: BodyInit | undefined;
  if (body !== undefined) {
    requestBody = typeof body === "string" ? body : JSON.stringify(body);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const url = `${resolveBaseUrl()}${normalizePath(path)}${buildQueryString(query)}`;

  const { signal, dispose } = composeSignal(callerSignal, timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: requestBody,
      cache,
      signal,
    });

    const text =
      response.status === 204 || response.status === 205
        ? ""
        : await response.text();

    if (!response.ok) {
      const { code, fields } = parseErrorPayload(text);
      throw new ApiError(response.status, code, fields);
    }

    if (text.length === 0) return undefined as T;

    try {
      return JSON.parse(text) as T;
    } catch (cause) {
      throw new ApiError(response.status, "", [], cause);
    }
  } finally {
    dispose();
  }
}
