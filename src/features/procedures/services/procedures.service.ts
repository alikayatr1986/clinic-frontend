import { apiRequest } from "@/lib/api";

export interface ProcedureOption {
  code: string;
  en: string;
  ar: string;
}

export interface FetchProceduresOptions {
  signal?: AbortSignal;
}

/**
 * Fetch the procedure catalog from the backend API.
 *
 * Endpoint: GET /api/v1/procedures
 * Response envelope: { data: ProcedureOption[] }
 */
export async function fetchProcedures(
  options: FetchProceduresOptions = {},
): Promise<ProcedureOption[]> {
  const body = await apiRequest<{ data: ProcedureOption[] }>(
    "/api/v1/procedures",
    { signal: options.signal },
  );
  return body.data;
}

