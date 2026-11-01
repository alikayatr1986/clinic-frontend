import type { NavItem } from "@/types/nav.types";

export const BLOG_PAGE_SIZE = 12;
export const BLOG_QUERY_MAX_LENGTH = 120;
export const BLOG_CTA_HREF = "/#contact";

export const BLOG_NAV_ITEMS: readonly NavItem[] = [
  { labelKey: "treatments", href: "/#treatments", anchor: "treatments" },
  { labelKey: "surgeon", href: "/#contact", anchor: "contact" },
  { labelKey: "blog", href: "/#blog", anchor: "blog" },
  { labelKey: "faq", href: "/#faq", anchor: "faq" },
  { labelKey: "contact", href: "/#contact", anchor: "contact" },
];
