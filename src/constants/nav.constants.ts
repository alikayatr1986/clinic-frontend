import type { NavItem } from "@/types/nav.types";

/**
 * Fixed 7-item site navigation catalog (header-contract §1, as renegotiated
 * on 2026-10-16: the Home and Our Hospitals items were dropped and the header
 * logo is the home link — see the story-2 spec's Spec Change Log).
 *
 * Single source of truth: the landing page derives its anchored `<main>`
 * landmark sections from this list now, and the header renders its links from
 * it in story 2.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Treatments", href: "#treatments", anchor: "treatments" },
  { label: "About Us", href: "#about-us", anchor: "about-us" },
  { label: "Meet the Surgeon", href: "#meet-the-surgeon", anchor: "meet-the-surgeon" },
  { label: "Packages & Pricing", href: "#packages-pricing", anchor: "packages-pricing" },
  { label: "Blog", href: "#blog", anchor: "blog" },
  { label: "FAQ", href: "#faq", anchor: "faq" },
  { label: "Contact", href: "#contact", anchor: "contact" },
];

/** Nav items that resolve to an on-page anchor section (the whole catalog). */
export const SECTION_ITEMS: ReadonlyArray<NavItem & { anchor: string }> =
  NAV_ITEMS.filter(
    (item): item is NavItem & { anchor: string } => item.anchor !== undefined,
  );
