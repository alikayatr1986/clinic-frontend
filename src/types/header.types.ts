import type { ComponentPropsWithoutRef } from "react";

import type { NavItem } from "@/types/nav.types";

export interface SiteHeaderProps {
  items: readonly NavItem[];
  ctaHref: string;
  activePath?: string;
  mobileNavDefaultOpen?: boolean;
  className?: string;
}

export interface PrimaryNavProps {
  items: readonly NavItem[];
  activePath?: string;
  className?: string;
}

export interface MobileNavProps {
  items: readonly NavItem[];
  ctaHref: string;
  activePath?: string;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export type LocalePillVariant = "bordered" | "borderless";

export interface LocalePillProps extends Omit<
  ComponentPropsWithoutRef<"button">,
  "onSelect"
> {
  locale?: string;
  variant?: LocalePillVariant;
  onLocaleChange?: (locale: string) => void;
}
