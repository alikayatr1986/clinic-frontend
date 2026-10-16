import { NAV_ITEMS } from "@/constants/nav.constants";
import type { PrimaryNavProps } from "@/types/header.types";
import { cn } from "@/lib/utils";
import { isActive } from "@/utils/nav.utils";

/**
 * Desktop primary navigation over the fixed 7-item catalog (header-contract
 * §1–2, as renegotiated 2026-10-16 — Home and Our Hospitals dropped, generous
 * gaps).
 *
 * Rendered inside the story-2 desktop row only; the active item gets crimson
 * text plus a 2px crimson underline offset below the label. Every link is a
 * >=48px target with a `focus-visible` ring.
 */
export function PrimaryNav({ activePath = "/", className }: PrimaryNavProps) {
  return (
    <nav
      aria-label="Primary"
      data-slot="primary-nav"
      className={cn("shrink-0", className)}
    >
      <ul className="flex items-center gap-x-5 xl:gap-x-8">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item, activePath);
          const isAnchor = item.href.startsWith("#");

          return (
            <li key={item.href}>
              <a
                href={item.href}
                aria-current={active ? (isAnchor ? "location" : "page") : undefined}
                data-active={active ? "true" : undefined}
                className={cn(
                  "inline-flex min-h-12 items-center whitespace-nowrap rounded-sm text-xs font-medium text-midnight-900 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:text-sm",
                  // The header is a fixed linen (light) surface in both themes, so
                  // hold the darker crimson accent in dark mode for AA contrast
                  // instead of the brightened --primary meant for dark canvases.
                  "dark:hover:text-crimson-600",
                  active && "text-primary dark:text-crimson-600",
                )}
              >
                <span
                  data-slot="nav-underline"
                  className={cn(
                    "inline-flex items-center border-b-2 border-transparent pb-1",
                    active && "border-primary dark:border-crimson-600",
                  )}
                >
                  {item.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
