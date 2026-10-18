import type { ComponentPropsWithoutRef } from "react";

export interface SiteHeaderProps {
  activePath?: string;
  mobileNavDefaultOpen?: boolean;
  className?: string;
}

export interface PrimaryNavProps {
  activePath?: string;
  className?: string;
}

export interface MobileNavProps {
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
