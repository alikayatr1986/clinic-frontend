"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Globe } from "lucide-react";

import { LOCALE_COOKIE, SUPPORTED_LOCALES } from "@/constants/locale.constants";
import { routing } from "@/i18n/routing";
import type { LocalePillProps } from "@/types/header.types";

import {
  DropdownMenu,
  DropdownMenuCheckIcon,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function LocalePill({
  locale: localeProp,
  variant = "bordered",
  onLocaleChange,
  className,
  onClick,
  ...props
}: LocalePillProps) {
  const activeLocale = useLocale();
  const locale = localeProp ?? activeLocale;
  const router = useRouter();
  const t = useTranslations();
  const label = locale.toUpperCase();

  const visibleLocales = SUPPORTED_LOCALES.filter((language) =>
    routing.locales.some((active) => active === language.code),
  );

  function switchLocale(code: string): void {
    if (code === locale) return;
    document.cookie = [
      `${LOCALE_COOKIE.name}=${code.toLowerCase()}`,
      `path=${LOCALE_COOKIE.path}`,
      `sameSite=${LOCALE_COOKIE.sameSite}`,
      `max-age=${LOCALE_COOKIE.maxAge}`,
    ].join("; ");
    router.refresh();
  }

  const handleLocaleChange = onLocaleChange ?? switchLocale;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-slot="locale-pill"
          data-variant={variant}
          aria-label={t("localePill.current", { current: label })}
          onClick={onClick}
          className={cn(
            "inline-flex h-12 shrink-0 items-center gap-1.5 rounded-lg bg-transparent px-2 text-xs font-medium text-midnight-900 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:gap-2 xl:px-3 xl:text-sm dark:hover:text-crimson-600",
            variant === "bordered" &&
              "border border-border hover:border-primary dark:hover:border-crimson-600",
            className,
          )}
          {...props}
        >
          <Globe className="size-4" aria-hidden="true" />
          <span lang={locale}>{label}</span>
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent data-slot="locale-menu" align="center">
        {visibleLocales.map((language) => (
          <DropdownMenuItem
            key={language.code}
            data-lang={language.code}
            lang={language.code}
            data-checked={language.code === locale ? "true" : undefined}
            onSelect={() => handleLocaleChange(language.code)}
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

