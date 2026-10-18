import type { NavItem } from "@/types/nav.types";
export const NAV_ITEMS: readonly NavItem[] = [
  { labelKey: "treatments", href: "#treatments", anchor: "treatments" },
  { labelKey: "about", href: "#about-us", anchor: "about-us" },
  { labelKey: "surgeon", href: "#meet-the-surgeon", anchor: "meet-the-surgeon" },
  { labelKey: "packages", href: "#packages-pricing", anchor: "packages-pricing" },
  { labelKey: "blog", href: "#blog", anchor: "blog" },
  { labelKey: "faq", href: "#faq", anchor: "faq" },
  { labelKey: "contact", href: "#contact", anchor: "contact" },
];
export const SECTION_ITEMS: ReadonlyArray<NavItem & {
  anchor: string;
}> = NAV_ITEMS.filter((item): item is NavItem & {
  anchor: string;
} => item.anchor !== undefined);
