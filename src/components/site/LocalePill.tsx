"use client";

import type { SVGProps } from "react";

import { SUPPORTED_LOCALES, stubLocaleChange } from "@/constants/locale.constants";
import type { LocalePillProps } from "@/types/header.types";

import {
  DropdownMenu,
  DropdownMenuCheckIcon,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Globe + locale + chevron pill that opens the supported-languages dropdown
 * (header-contract §2 desktop / §3 mobile borderless).
 *
 * A client component so `SiteHeader` stays a server component. The trigger
 * keeps the pill's ≥48px target and `data-variant` hook; item activation
 * fires the `onLocaleChange` hook.
 */
export function LocalePill({
  locale = "en",
  variant = "bordered",
  onLocaleChange = stubLocaleChange,
  className,
  onClick,
  ...props
}: LocalePillProps) {
  const label = locale.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-slot="locale-pill"
          data-variant={variant}
          aria-label={`Change language, current ${label}`}
          onClick={onClick}
          className={cn(
            "inline-flex h-12 shrink-0 items-center gap-1.5 rounded-lg bg-transparent px-2 text-xs font-medium text-midnight-900 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:gap-2 xl:px-3 xl:text-sm dark:hover:text-crimson-600",
            variant === "bordered" &&
              "border border-border hover:border-primary dark:hover:border-crimson-600",
            className,
          )}
          {...props}
        >
          <GlobeIcon className="size-4" aria-hidden="true" />
          <span lang={locale}>{label}</span>
          <ChevronDownIcon className="size-3.5" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent data-slot="locale-menu" align="center">
        {SUPPORTED_LOCALES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            data-lang={language.code}
            lang={language.code}
            data-checked={language.code === locale ? "true" : undefined}
            onSelect={() => onLocaleChange(language.code)}
          >
            {language.label}
            {language.code === locale && (
              <DropdownMenuCheckIcon className="absolute end-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function GlobeIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </svg>
  );
}

function ChevronDownIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
