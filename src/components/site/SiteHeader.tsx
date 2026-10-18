import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import {
  LOGO_HEIGHT,
  LOGO_SRC,
  LOGO_WIDTH,
  MOBILE_LOGO_HEIGHT,
  MOBILE_LOGO_SRC,
  MOBILE_LOGO_WIDTH,
} from "@/constants/header.constants";
import type { SiteHeaderProps } from "@/types/header.types";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { LocalePill } from "./LocalePill";
import { MobileNav } from "./MobileNav";
import { PrimaryNav } from "./PrimaryNav";

export function SiteHeader({
  activePath = "/",
  mobileNavDefaultOpen,
  className,
}: SiteHeaderProps) {
  const t = useTranslations("header");

  return (
    <header
      data-slot="site-header"
      className={cn(
        "fixed inset-x-0 top-0 z-60 h-16 border-b border-border bg-linen text-midnight-900 lg:h-20",
        className,
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 xl:px-8">
        <div
          data-slot="site-header-mobile"
          className="flex w-full items-center justify-between gap-2 lg:hidden"
        >
          <Link
            href="/"
            className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Image
              src={MOBILE_LOGO_SRC}
              alt={t("logoAlt")}
              width={MOBILE_LOGO_WIDTH}
              height={MOBILE_LOGO_HEIGHT}
              loading="eager"
              className="h-9 w-auto"
            />
          </Link>

          <div className="flex shrink-0 items-center gap-1">
            <LocalePill variant="borderless" />
            <MobileNav
              activePath={activePath}
              defaultOpen={mobileNavDefaultOpen}
            />
          </div>
        </div>

        <div
          data-slot="site-header-desktop"
          className="hidden w-full items-center justify-between gap-2 lg:flex xl:gap-4"
        >
          <Link
            href="/"
            className="inline-flex min-h-12 shrink-0 items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Image
              src={LOGO_SRC}
              alt={t("logoAlt")}
              width={LOGO_WIDTH}
              height={LOGO_HEIGHT}
              preload
              sizes="(min-width: 1280px) 142px, 126px"
              className="h-8 w-auto xl:h-9"
            />
          </Link>

          <PrimaryNav activePath={activePath} />

          <div className="flex shrink-0 items-center gap-2">
            <LocalePill />
            <Button asChild size="header">
              <a href="#contact">
                {t("cta")}
                <ArrowRight className="rtl:-scale-x-100" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
