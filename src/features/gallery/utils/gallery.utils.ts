import {
  TIMEFRAME_OPTIONS,
} from "../constants/gallery.constants";
import type { GalleryOption } from "../types/gallery.types";

type GetLabel = (key: string) => string;

function getFilterLabel(
  value: string | undefined,
  options: typeof TIMEFRAME_OPTIONS,
  getLabel: GetLabel,
): string {
  if (!value) return "";

  const option = options.find((candidate) => candidate.value === value);
  return option ? getLabel(option.labelKey) : value;
}

export function getTimeframeLabel(
  value: string | undefined,
  getLabel: GetLabel,
  dynamicTimeframes?: readonly GalleryOption[],
  locale?: string,
): string {
  if (!value) return "";

  if (dynamicTimeframes && dynamicTimeframes.length > 0) {
    const found = dynamicTimeframes.find((candidate) => candidate.code === value);
    if (found) {
      const isRetired = found.retired || found.status === "retired";
      const base = locale === "ar" ? found.ar : found.en;
      if (isRetired) {
        return locale === "ar" ? `${base} (متقاعد)` : `${base} (Retired)`;
      }
      return base;
    }
  }

  return getFilterLabel(value, TIMEFRAME_OPTIONS, getLabel);
}

export function formatGalleryEyebrow(value: string): string {
  return value.replace(/^\s*(?:6|٦)\.\s*/u, "");
}
