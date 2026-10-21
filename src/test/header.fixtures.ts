import type { NavItem } from "@/types/nav.types";
export const HEADER_NAV_ITEMS: readonly NavItem[] = [
  { labelKey: "treatments", href: "#treatments", anchor: "treatments" },
  { labelKey: "about", href: "#about-us", anchor: "about-us" },
  { labelKey: "surgeon", href: "#meet-the-surgeon", anchor: "meet-the-surgeon" },
  { labelKey: "packages", href: "#packages-pricing", anchor: "packages-pricing" },
  { labelKey: "blog", href: "#blog", anchor: "blog" },
  { labelKey: "faq", href: "#faq", anchor: "faq" },
  { labelKey: "contact", href: "#contact", anchor: "contact" },
];

export const HEADER_CTA_HREF = "#contact";
