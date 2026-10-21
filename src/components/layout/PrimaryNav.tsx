import { useTranslations } from "next-intl";

import type { PrimaryNavProps } from "@/types/header.types";
import { cn } from "@/lib/utils";
import { isActive } from "@/utils/nav.utils";

export function PrimaryNav({ items, activePath = "/", className }: PrimaryNavProps) {
  const t = useTranslations();
  const tNav = useTranslations("nav");

  return (
    <nav
      aria-label={t("aria.primaryNav")}
      data-slot="primary-nav"
      className={cn("shrink-0", className)}
    >
      <ul className="flex items-center gap-x-5 xl:gap-x-8">
        {items.map((item) => {
          const active = isActive(item, activePath);
          const isAnchor = item.href.startsWith("#");

          return (
            <li key={item.href}>
              <a
                href={item.href}
                aria-current={
                  active ? (isAnchor ? "location" : "page") : undefined
                }
                data-active={active ? "true" : undefined}
                className={cn(
                  "inline-flex min-h-12 items-center whitespace-nowrap rounded-sm text-xs font-medium text-midnight-900 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:text-sm",
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
                  {tNav(item.labelKey)}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
