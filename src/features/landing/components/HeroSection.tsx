import Link from "next/link";
import { ArrowRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocale, useTranslations } from "next-intl";

import {
  HERO_ARTWORK,
  HERO_ACTIONS,
  HERO_TRUST_ITEMS,
  HERO_DESKTOP_IMAGE,
  HERO_DESKTOP_MEDIA,
  HERO_MOBILE_IMAGE,
} from "@/features/landing/constants/hero.constants";

export function HeroSection() {
  const t = useTranslations("hero");
  const locale = useLocale();
  const isArabic = locale === "ar";

  return (
    <section
      lang={locale}
      dir={isArabic ? "rtl" : "ltr"}
      className="relative isolate min-h-[139vw] overflow-hidden bg-[var(--hero-background)] text-[var(--hero-foreground)] [--foreground:var(--hero-foreground)] lg:min-h-[clamp(42rem,calc(100svh-5rem),60rem)]"
      data-slot="hero"
      aria-labelledby="hero-heading"
    >
      <picture className="absolute inset-x-0 top-[-20vw] -z-10 block aspect-[937/1678] [mask-image:linear-gradient(to_bottom,black_80vw,transparent_96vw,transparent_118vw,black_135vw)] lg:top-0 lg:h-[clamp(42rem,calc(100svh-5rem),60rem)] lg:aspect-auto lg:[mask-image:none]">
        <source
          media={HERO_DESKTOP_MEDIA}
          srcSet={HERO_DESKTOP_IMAGE.srcSet}
          sizes={HERO_DESKTOP_IMAGE.sizes}
          width={HERO_ARTWORK.desktop.width}
          height={HERO_ARTWORK.desktop.height}
        />
        {/* Art direction requires one img fallback, as documented by Next. */}
        <img {...HERO_MOBILE_IMAGE} className="block h-auto w-full rtl:-scale-x-100 lg:h-full lg:object-cover lg:object-center" alt="" aria-hidden="true" />
      </picture>
      <div
        className={`relative px-[6%] pt-[77vw] pb-12 [overflow-wrap:anywhere] lg:mx-auto lg:w-full lg:max-w-7xl lg:px-6 lg:pt-[clamp(7rem,15vh,11rem)] lg:pb-16 xl:px-8 ${isArabic ? "[font-family:var(--font-noto-arabic),system-ui,sans-serif]" : "[font-family:var(--font-manrope),var(--font-noto-arabic),system-ui,sans-serif]"}`}
        lang={locale}
        dir={isArabic ? "rtl" : "ltr"}
      >
        <p className={`flex items-center gap-3 text-[var(--hero-muted-foreground)] text-[clamp(.625rem,2.3vw,.875rem)] leading-normal before:h-px before:basis-[2.4em] before:shrink-0 before:bg-[var(--hero-accent)] before:content-[''] lg:me-auto lg:max-w-[58%] lg:gap-[1.125rem] lg:text-[clamp(.6875rem,.88vw,1.125rem)] lg:before:basis-[3.1em] ${isArabic ? "tracking-normal" : "tracking-[.12em] lg:tracking-[.24em]"}`}>{t("eyebrow")}</p>
        <h1 id="hero-heading" className={`mt-3 max-w-[7.5em] font-normal text-[clamp(2.25rem,9.9vw,4.75rem)] leading-[1.02] lg:me-auto lg:mt-6 lg:max-w-[58%] lg:text-[clamp(2.5rem,4.2vw,4.5rem)] lg:leading-[1.06] ${isArabic ? "max-w-[11em] leading-[1.45] tracking-normal lg:leading-[1.5]" : "font-hero-display tracking-[-.025em]"}`}>{t("heading")}</h1>
        <p className="mt-3 max-w-[42em] text-[var(--hero-muted-foreground)] text-[clamp(1rem,3.2vw,1.375rem)] leading-[1.5] lg:me-auto lg:mt-6 lg:max-w-[58%] lg:text-[clamp(1rem,1.35vw,1.75rem)]">{t("description")}</p>
        <div className="mt-7 flex flex-col gap-4 lg:me-auto lg:max-w-[58%] lg:flex-row lg:flex-wrap">
          <Button asChild size="hero">
            <Link href={HERO_ACTIONS.primary}><Video aria-hidden="true" /><span className="min-w-0">{t("primaryAction")}</span><ArrowRight aria-hidden="true" className="shrink-0 rtl:-scale-x-100" data-hero-arrow="" /></Link>
          </Button>
          <Button asChild variant="outline" size="hero">
            <Link href={HERO_ACTIONS.secondary}><span className="min-w-0">{t("secondaryAction")}</span><ArrowRight aria-hidden="true" className="shrink-0 rtl:-scale-x-100" data-hero-arrow="" /></Link>
          </Button>
        </div>
        <div className="mt-8 overflow-x-auto overscroll-x-contain rounded-xl p-1 snap-x snap-proximity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] lg:me-auto lg:mt-10 lg:max-w-[58%] lg:overflow-visible" role="group" tabIndex={0} aria-label={t("trustScrollLabel")}>
          <ul className="flex gap-4 pb-2 lg:pb-0">
            {HERO_TRUST_ITEMS.map(({ key, icon: Icon }, index) => (
              <li key={key} className={`min-w-0 flex-[0_0_70%] snap-start text-base leading-normal lg:flex-[1_1_0] lg:text-[clamp(.75rem,.9vw,1.125rem)] ${index > 0 ? "lg:border-s lg:border-[var(--border)] lg:ps-4" : ""}`}>
                <Card variant="trust"><Icon aria-hidden="true" /><span>{t(key)}</span></Card>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
