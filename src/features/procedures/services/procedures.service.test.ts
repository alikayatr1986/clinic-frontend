import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, ApiError } from "@/lib/api";
import { fetchProcedures, type ProcedureOption } from "./procedures.service";

vi.mock("@/lib/api", () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    readonly fields: string[];
    constructor(status: number, code = "", fields: string[] = []) {
      super(`API request failed with status ${status}`);
      this.name = "ApiError";
      this.status = status;
      this.code = code;
      this.fields = fields;
    }
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("procedures service", () => {
  const mockProcedures: ProcedureOption[] = [
    { code: "rhinoplasty", en: "Rhinoplasty", ar: "تجميل الأنف" },
    { code: "revision_rhinoplasty", en: "Revision rhinoplasty", ar: "إعادة تجميل الأنف" },
  ];

  it("unwraps the data array from the backend response envelope", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({ data: mockProcedures });

    const result = await fetchProcedures();

    expect(result).toEqual(mockProcedures);
    expect(apiRequest).toHaveBeenCalledWith("/api/v1/procedures", { signal: undefined });
  });

  it("forwards the abort signal to the transport", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({ data: mockProcedures });
    const controller = new AbortController();

    await fetchProcedures({ signal: controller.signal });

    expect(apiRequest).toHaveBeenCalledWith("/api/v1/procedures", { signal: controller.signal });
  });

  it("propagates transport errors without swallowing them", async () => {
    const error = new ApiError(500, "INTERNAL_ERROR");
    vi.mocked(apiRequest).mockRejectedValueOnce(error);

    await expect(fetchProcedures()).rejects.toThrow(error);
  });

  it("propagates abort / cancellation errors", async () => {
    const abortError = new DOMException("The operation was aborted", "AbortError");
    vi.mocked(apiRequest).mockRejectedValueOnce(abortError);

    await expect(fetchProcedures()).rejects.toThrow("aborted");
  });
});

