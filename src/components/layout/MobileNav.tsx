"use client";

import { useState } from "react";

import { ArrowRight, Menu } from "lucide-react";
import { useTranslations } from "next-intl";

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
import { isActive } from "@/utils/nav.utils";

export function MobileNav({
  items,
  ctaHref,
  activePath = "/",
  defaultOpen,
  onOpenChange,
  className,
}: MobileNavProps) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  const t = useTranslations();
  const tNav = useTranslations("nav");

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
          aria-label={t("aria.openMenu")}
          className={cn(
            "pointer-events-auto inline-flex size-12 shrink-0 items-center justify-center rounded-sm text-midnight-900 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:text-crimson-600",
            className,
          )}
        >
          <Menu
            data-open={open}
            aria-hidden="true"
            className={cn(
              "size-6 shrink-0",
              "[&>path]:[transform-box:fill-box] [&>path]:origin-center",
              "[&>path]:transition-[opacity,translate,rotate] [&>path]:duration-300 [&>path]:motion-reduce:transition-none",
              "[&>path:nth-child(2)]:duration-200",
              "data-[open=true]:[&>path:nth-child(1)]:translate-y-[7px] data-[open=true]:[&>path:nth-child(1)]:rotate-45",
              "data-[open=true]:[&>path:nth-child(2)]:opacity-0",
              "data-[open=true]:[&>path:nth-child(3)]:-translate-y-[7px] data-[open=true]:[&>path:nth-child(3)]:-rotate-45",
            )}
          />
        </button>
      </SheetTrigger>
      
      <SheetContent side="end" tone="linen" headerClearance withClose={false}>
        <SheetTitle className="sr-only">{t("aria.srNavTitle")}</SheetTitle>
        <SheetDescription className="sr-only">
          {t("aria.srNavDescription")}
        </SheetDescription>

        <nav aria-label={t("aria.mobileNav")} data-slot="mobile-nav">
          <ul className="flex flex-col">
            {items.map((item) => {
              const active = isActive(item, activePath);

              return (
                <li key={item.href} className="flex">
                  <SheetClose asChild>
                    <a
                      href={item.href}
                      aria-current={active ? "location" : undefined}
                      className={cn(
                        "flex min-h-12 w-full items-center px-4 text-sm font-medium text-midnight-900 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:text-crimson-600",

                        active && "text-primary dark:text-crimson-600",
                      )}
                    >
                      {tNav(item.labelKey)}
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
              <a href={ctaHref}>
                {t("header.cta")}
                <ArrowRight className="rtl:-scale-x-100" aria-hidden="true" />
              </a>
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
