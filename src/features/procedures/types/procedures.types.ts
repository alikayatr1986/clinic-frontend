export interface ProcedureOption {
  code: string;
  en: string;
  ar: string;
  status?: "active" | "retired";
  retired?: boolean;
}

export interface FetchProceduresOptions {
  signal?: AbortSignal;
}
