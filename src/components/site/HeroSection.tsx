import Link from "next/link";
import { ArrowRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocale, useTranslations } from "next-intl";

import "@/styles/hero.styles.css";

import {
  HERO_ARTWORK,
  HERO_ACTIONS,
  HERO_TRUST_ITEMS,
  HERO_DESKTOP_IMAGE,
  HERO_DESKTOP_MEDIA,
  HERO_MOBILE_IMAGE,
} from "@/constants/hero.constants";

export function HeroSection() {
  const t = useTranslations("hero");
  const locale = useLocale();
  const isArabic = locale === "ar";

  return (
    <section lang={locale} dir={isArabic ? "rtl" : "ltr"} className="hero" data-slot="hero" aria-labelledby="hero-heading">
      <picture className="hero-artwork">
        <source
          media={HERO_DESKTOP_MEDIA}
          srcSet={HERO_DESKTOP_IMAGE.srcSet}
          sizes={HERO_DESKTOP_IMAGE.sizes}
          width={HERO_ARTWORK.desktop.width}
          height={HERO_ARTWORK.desktop.height}
        />
        {/* Art direction requires one img fallback, as documented by Next. */}
        <img {...HERO_MOBILE_IMAGE} alt="" aria-hidden="true" />
      </picture>
      <div className="hero-copy" lang={locale} dir={isArabic ? "rtl" : "ltr"}>
        <p className="hero-eyebrow">{t("eyebrow")}</p>
        <h1 id="hero-heading" className="hero-heading">{t("heading")}</h1>
        <p className="hero-description">{t("description")}</p>
        <div className="hero-actions">
          <Button asChild size="hero">
            <Link href={HERO_ACTIONS.primary}><Video aria-hidden="true" /><span>{t("primaryAction")}</span><ArrowRight aria-hidden="true" data-hero-arrow="" /></Link>
          </Button>
          <Button asChild variant="outline" size="hero">
            <Link href={HERO_ACTIONS.secondary}><span>{t("secondaryAction")}</span><ArrowRight aria-hidden="true" data-hero-arrow="" /></Link>
          </Button>
        </div>
        <div className="hero-trust" role="group" tabIndex={0} aria-label={t("trustScrollLabel")}>
          <ul className="hero-trust-list">
            {HERO_TRUST_ITEMS.map(({ key, icon: Icon }) => (
              <li key={key} className="hero-trust-item">
                <Card variant="trust"><Icon aria-hidden="true" /><span>{t(key)}</span></Card>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
