import { useTranslations } from "next-intl";

import { NAV_ITEMS, SECTION_ITEMS } from "@/features/landing/constants/nav.constants";
import { HERO_ACTIONS } from "@/features/landing/constants/hero.constants";
import { HeroSection } from "@/features/landing/components/HeroSection";
import { TreatmentServicesSection } from "@/features/landing/components/TreatmentServicesSection";
import { WhyTurkeySection } from "@/features/landing/components/WhyTurkeySection";
import { SiteHeader } from "@/components/layout/SiteHeader";

export function LandingPage() {

  const tNav = useTranslations("nav");

  return (
    <>
      <SiteHeader items={NAV_ITEMS} ctaHref={HERO_ACTIONS.primary} />
      <main className="flex-1">
        <HeroSection />
        <WhyTurkeySection />
        <TreatmentServicesSection />
        {SECTION_ITEMS.filter(({ anchor }) => anchor !== "treatments").map(({ anchor, labelKey }) => (
          <section
            key={anchor}
            id={anchor}
            aria-label={tNav(labelKey)}
            className="min-h-40 scroll-mt-16 lg:scroll-mt-20"
          />
        ))}
      </main>
    </>
  );
}
