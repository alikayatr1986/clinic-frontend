import { useTranslations } from "next-intl";

import { SECTION_ITEMS } from "@/constants/nav.constants";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function Home() {

  const tNav = useTranslations("nav");

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-16 lg:pt-20">
        {SECTION_ITEMS.map(({ anchor, labelKey }) => (
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
