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

export const TIMEFRAME_OPTIONS: readonly GalleryFilterOption[] = [
  {
    value: "synthetic-time",
    labelKey: "timeframe_synthetic",
  },
  {
    value: "1-month",
    labelKey: "timeframe_1_month",
  },
  {
    value: "3-months",
    labelKey: "timeframe_3_months",
  },
  {
    value: "6-months",
    labelKey: "timeframe_6_months",
  },
  {
    value: "1-year",
    labelKey: "timeframe_1_year",
  },
];

