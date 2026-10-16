import Image from "next/image";
import Link from "next/link";

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
import { ArrowRightIcon } from "./icons";
import { MobileNav } from "./MobileNav";
import { PrimaryNav } from "./PrimaryNav";

/**
 * Fixed site header shell (header-contract §4) with the story-2 desktop row
 * and the story-3 mobile row.
 *
 * At >=1024px (`hidden lg:flex`) the row shows the logo, the 7-item
 * gap-separated `PrimaryNav`, the static EN pill, and the crimson consultation
 * CTA. Below `lg` (`flex lg:hidden`) the compact mobile row shows the derived
 * face mark beside the wordmark, the borderless EN pill, and the
 * `MobileNav` hamburger; the scroll-threshold animation arrives in story 4.
 */
export function SiteHeader({
  activePath = "/",
  mobileNavDefaultOpen,
  className,
}: SiteHeaderProps) {
  return (
    <header
      data-slot="site-header"
      className={cn(
        "fixed inset-x-0 top-0 z-60 h-16 border-b border-border bg-linen text-midnight-900 lg:h-20",
        className,
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 xl:px-8">
        {/* Story-3 mobile row: mark + wordmark left, EN pill + hamburger right. */}
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
              alt="Dr. Naser Dadaszade"
              width={MOBILE_LOGO_WIDTH}
              height={MOBILE_LOGO_HEIGHT}
              // Above the fold on the mobile viewport it serves; the desktop
              // logo keeps the preload because it is the desktop LCP candidate.
              loading="eager"
              // Rendered at ~20px wide (h-9): the intrinsic 173px source
              // covers 1x/2x without a custom `sizes` split.
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

        {/* Story-2 desktop row. */}
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
              alt="Dr. Naser Dadaszade"
              width={LOGO_WIDTH}
              height={LOGO_HEIGHT}
              preload
              // Rendered at ~126px (h-8) / ~142px (xl:h-9): keep the srcset
              // and preload on the small candidate instead of 1920w (~38 KB).
              sizes="(min-width: 1280px) 142px, 126px"
              className="h-8 w-auto xl:h-9"
            />
          </Link>

          <PrimaryNav activePath={activePath} />

          <div className="flex shrink-0 items-center gap-2">
            <LocalePill />
            <Button asChild size="header">
              <a href="#contact">
                Book Free Consultation
                <ArrowRightIcon className="rtl:-scale-x-100" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
