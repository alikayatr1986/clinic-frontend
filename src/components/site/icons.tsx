import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Site-level inline icons shared across header components so mirrored pairs
 * (desktop CTA / mobile menu CTA) stay byte-identical.
 */

/** Mirrors in RTL (layout only) — the consultation CTA arrow. */
export function ArrowRightIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
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
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
