import {
  PROCEDURE_OPTIONS,
  TIMEFRAME_OPTIONS,
} from "../constants/gallery.constants";

type GetLabel = (key: string) => string;

function getFilterLabel(
  value: string | undefined,
  options: typeof PROCEDURE_OPTIONS | typeof TIMEFRAME_OPTIONS,
  getLabel: GetLabel,
): string {
  if (!value) return "";

  const option = options.find((candidate) => candidate.value === value);
  return option ? getLabel(option.labelKey) : value;
}

export function getProcedureLabel(
  value: string | undefined,
  getLabel: GetLabel,
): string {
  return getFilterLabel(value, PROCEDURE_OPTIONS, getLabel);
}

export function getTimeframeLabel(
  value: string | undefined,
  getLabel: GetLabel,
): string {
  return getFilterLabel(value, TIMEFRAME_OPTIONS, getLabel);
}

export function formatGalleryEyebrow(value: string): string {
  return value.replace(/^\s*(?:6|٦)\.\s*/u, "");
}
