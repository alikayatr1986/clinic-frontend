import type { NavItem } from "@/types/nav.types";

export const BLOG_PAGE_SIZE = 12;
export const BLOG_QUERY_MAX_LENGTH = 120;
export const BLOG_CTA_HREF = "/#contact";

export const BLOG_NAV_ITEMS: readonly NavItem[] = [
  { labelKey: "treatments", href: "/#treatments", anchor: "treatments" },
  { labelKey: "about", href: "/#about-us", anchor: "about-us" },
  { labelKey: "surgeon", href: "/#meet-the-surgeon", anchor: "meet-the-surgeon" },
  { labelKey: "packages", href: "/#packages-pricing", anchor: "packages-pricing" },
  { labelKey: "blog", href: "/#blog", anchor: "blog" },
  { labelKey: "faq", href: "/#faq", anchor: "faq" },
  { labelKey: "contact", href: "/#contact", anchor: "contact" },
];
