/**
 * Types for the fixed 7-item site navigation catalog
 * (header-contract §1, as renegotiated on 2026-10-16: the Home and Our
 * Hospitals items were dropped and the header logo is the home link — see
 * the story-2 spec's Spec Change Log).
 */

export interface NavItem {
  /** Visible nav label. */
  readonly label: string;
  /** Link target — an in-page anchor (`#foo`). */
  readonly href: string;
  /** Landing section id for the item's on-page anchor. */
  readonly anchor?: string;
}
