"use client";

import { useState, type SVGProps } from "react";

import type { MobileNavProps } from "@/types/header.types";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/constants/nav.constants";
import { isActive } from "@/utils/nav.utils";

import { ArrowRightIcon } from "./icons";

/**
 * Mobile navigation entry point (header-contract §3): a >=48px hamburger
 * trigger opening the right slide-in `ui/Sheet` panel with the full 7-item
 * catalog stacked plus the consultation CTA at the bottom.
 *
 * The Sheet owns the hard a11y — Escape, overlay close, focus trap, focus
 * return, `aria-expanded` on the trigger — so this component only tunes
 * content and hit targets: every row and the CTA is a >=48px full-width
 * target, each wrapped in `SheetClose asChild` so activation closes the panel
 * first and then lets the browser follow the `#anchor` / `#contact` target.
 * Panel surface is `bg-linen` with `text-midnight-900` so it reads as part of
 * the fixed header sheet in both themes.
 *
 * Close affordance (renegotiation 3, 2026-10-16): the UI-foundation close ✕ is
 * visually suppressed from this panel via consumer-side CSS — no
 * `components/ui` edit — and there is no close control inside the panel. The
 * hamburger trigger's own bars morph into the lines-cross (`MenuIcon open`)
 * and the trigger stays above the open panel (`pointer-events-auto`), which
 * combined with the raised header `z-60` and the Sheet's foundation-owned
 * `headerClearance` row padding keeps the ✕ precisely where the hamburger
 * lives. Open state
 * is controlled so the trigger icon, Radix, and telemetry share one truth.
 */
export function MobileNav({
  activePath = "/",
  defaultOpen,
  onOpenChange,
  className,
}: MobileNavProps) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        onOpenChange?.(next);
      }}
    >
      <SheetTrigger asChild>
        <button
          type="button"
          data-slot="mobile-nav-trigger"
          aria-label="Open navigation menu"
          className={cn(
            // `pointer-events-auto` keeps the morphing hamburger clickable
            // while the modal panel is open: Radix suppresses outside pointer
            // events, but this trigger sits above the panel (renegotiation 3)
            // and is the close control.
            "pointer-events-auto inline-flex size-12 shrink-0 items-center justify-center rounded-sm text-midnight-900 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:text-crimson-600",
            className,
          )}
        >
          <MenuIcon open={open} className="size-6" aria-hidden="true" />
        </button>
      </SheetTrigger>
      {/* `side="right"` pins header-contract §3's frozen right slide-in
          (it is also the Sheet's default); all panel styling is foundation-
          owned: `tone="linen"`, `headerClearance` (rows start under the
          fixed header), and `withClose={false}` (renegotiation 3 removes the
          built-in ✕ as the close affordance). */}
      <SheetContent
        side="right"
        tone="linen"
        headerClearance
        withClose={false}
      >
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <SheetDescription className="sr-only">
          Site navigation links and the consultation entry point
        </SheetDescription>

        <nav aria-label="Mobile" data-slot="mobile-nav">
          <ul className="flex flex-col">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item, activePath);

              return (
                <li key={item.href} className="flex">
                  <SheetClose asChild>
                    <a
                      href={item.href}
                      aria-current={active ? "location" : undefined}
                      className={cn(
                        "flex min-h-12 w-full items-center px-4 text-sm font-medium text-midnight-900 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:text-crimson-600",
                        // Same accent treatment as the desktop nav: the panel
                        // is a fixed linen (light) surface in both themes, so
                        // hold the darker crimson for AA contrast instead of
                        // the brightened --primary meant for dark canvases.
                        active && "text-primary dark:text-crimson-600",
                      )}
                    >
                      {item.label}
                    </a>
                  </SheetClose>
                </li>
              );
            })}
          </ul>
        </nav>

        <SheetFooter>
          <SheetClose asChild>
            <Button asChild>
              <a href="#contact">
                Book Free Consultation
                <ArrowRightIcon className="rtl:-scale-x-100" aria-hidden="true" />
              </a>
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Three midnight-stroke hamburger bars (stroke inherits `text-midnight-900`)
 * that morph into a cross when `open`: the top bar drops and rotates +45°,
 * the bottom rises and rotates −45°, and the middle bar fades out. The
 * transforms run around each line's own center (`transform-box: fill-box`),
 * with `motion-reduce` falling back to an instant swap.
 */
function MenuIcon({
  open = false,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { open?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      {...props}
    >
      <line
        x1="4"
        y1="6"
        x2="20"
        y2="6"
        className="transition-transform duration-300 motion-reduce:transition-none"
        style={{
          transformBox: "fill-box",
          transformOrigin: "center",
          transform: open ? "translateY(6px) rotate(45deg)" : undefined,
        }}
      />
      <line
        x1="4"
        y1="12"
        x2="20"
        y2="12"
        className={cn(
          "transition-opacity duration-200 motion-reduce:transition-none",
          open ? "opacity-0" : "opacity-100",
        )}
      />
      <line
        x1="4"
        y1="18"
        x2="20"
        y2="18"
        className="transition-transform duration-300 motion-reduce:transition-none"
        style={{
          transformBox: "fill-box",
          transformOrigin: "center",
          transform: open ? "translateY(-6px) rotate(-45deg)" : undefined,
        }}
      />
    </svg>
  );
}
