import type { ComponentPropsWithoutRef } from "react";

/**
 * Types for the site header components (SiteHeader and its nav pieces).
 */

export interface SiteHeaderProps {
  /**
   * Current location used to mark the active nav item. Defaults to `/`;
   * nothing is active on the landing page (the logo is the home link).
   */
  activePath?: string;
  /**
   * Story/test hook only: renders the mobile menu panel open on first paint
   * (uncontrolled `defaultOpen` on the `MobileNav` Sheet). Undefined keeps
   * the hamburger as the sole entry point.
   */
  mobileNavDefaultOpen?: boolean;
  className?: string;
}

export interface PrimaryNavProps {
  /**
   * Current location used to mark the active item. Defaults to the landing
   * route (`/`); with `Home` removed from the catalog nothing is active on
   * `/` — the prop drives section activation (`/#treatments`) now and
   * scroll-spy later.
   */
  activePath?: string;
  className?: string;
}

export interface MobileNavProps {
  /**
   * Current location used to mark the active row. Defaults to the landing
   * route (`/`); nothing is active on `/` — the logo link inside the mobile
   * row is the home link, mirroring the desktop row.
   */
  activePath?: string;
  /**
   * Radix uncontrolled-open default. The hamburger trigger owns open state
   * otherwise; this only serves stories/tests and open-state rendering.
   */
  defaultOpen?: boolean;
  /** Radix open-state change hook, for close-count and telemetry assertions. */
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/** LocalePill presentation: bordered desktop pill or borderless mobile pill. */
export type LocalePillVariant = "bordered" | "borderless";

export interface LocalePillProps extends Omit<
  ComponentPropsWithoutRef<"button">,
  "onSelect"
> {
  /** Active locale code displayed by the pill and flagged in the menu. */
  locale?: string;
  /**
   * `bordered` (default) is the desktop pill with the `border-border` ring
   * (header-contract §2); `borderless` drops the border for the mobile row
   * (header-contract §3).
   */
  variant?: LocalePillVariant;
  /** Stubbed locale-switch hook; defaults to the inert `stubLocaleChange`. */
  onLocaleChange?: (locale: string) => void;
}
