import type { NavItem } from "@/types/nav.types";
import type { GalleryFilterOption } from "../types/gallery.types";

export const DEFAULT_PAGE_SIZE = 12;

export const GALLERY_NAV_ITEMS: readonly NavItem[] = [
  { labelKey: "treatments", href: "/#treatments", anchor: "treatments" },
  { labelKey: "about", href: "/#about-us", anchor: "about-us" },
  { labelKey: "surgeon", href: "/#meet-the-surgeon", anchor: "meet-the-surgeon" },
  { labelKey: "packages", href: "/#packages-pricing", anchor: "packages-pricing" },
  { labelKey: "blog", href: "/#blog", anchor: "blog" },
  { labelKey: "faq", href: "/#faq", anchor: "faq" },
  { labelKey: "contact", href: "/#contact", anchor: "contact" },
];

export const GALLERY_CTA_HREF = "/#contact";

export const PROCEDURE_OPTIONS: readonly GalleryFilterOption[] = [
  {
    value: "synthetic-procedure",
    labelKey: "procedure_synthetic",
    fallbackLabel: "Synthetic procedure",
  },
  {
    value: "rhinoplasty",
    labelKey: "procedure_rhinoplasty",
    fallbackLabel: "Rhinoplasty",
  },
  {
    value: "revision-rhinoplasty",
    labelKey: "procedure_revision_rhinoplasty",
    fallbackLabel: "Revision Rhinoplasty",
  },
  {
    value: "septoplasty",
    labelKey: "procedure_septoplasty",
    fallbackLabel: "Septoplasty",
  },
];

export const TIMEFRAME_OPTIONS: readonly GalleryFilterOption[] = [
  {
    value: "synthetic-time",
    labelKey: "timeframe_synthetic",
    fallbackLabel: "Synthetic timeframe",
  },
  {
    value: "1-month",
    labelKey: "timeframe_1_month",
    fallbackLabel: "1 Month Post-Op",
  },
  {
    value: "3-months",
    labelKey: "timeframe_3_months",
    fallbackLabel: "3 Months Post-Op",
  },
  {
    value: "6-months",
    labelKey: "timeframe_6_months",
    fallbackLabel: "6 Months Post-Op",
  },
  {
    value: "1-year",
    labelKey: "timeframe_1_year",
    fallbackLabel: "1 Year Post-Op",
  },
];

