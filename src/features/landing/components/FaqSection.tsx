import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { HERO_ACTIONS } from "@/features/landing/constants/hero.constants";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqSection() {
  const t = useTranslations("faqSection");
  const tHeader = useTranslations("header");
  const locale = useLocale();
  const isArabic = locale === "ar";

  return (
    <section
      id="faq"
      lang={locale}
      dir={isArabic ? "rtl" : "ltr"}
      aria-labelledby="faq-heading"
      className="scroll-mt-16 lg:scroll-mt-20 bg-[#fdfbf7] text-[#0b132b] dark:bg-[#111d3a] dark:text-[#f8faf8]"
    >
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] lg:gap-x-16 lg:gap-y-8 lg:px-8 lg:py-28">
        <div>
          <p className="flex items-center gap-3 text-xs font-bold text-[#536174] before:h-px before:w-9 before:bg-crimson-600 before:content-[''] dark:text-[#c0cada]">
            {t("eyebrow")}
          </p>
          <h2 id="faq-heading" className={`mt-5 text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.1] ${isArabic ? "[font-family:var(--font-noto-arabic),sans-serif] leading-[1.4]" : "font-hero-display"}`}>
            {t("heading")}
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#536174] dark:text-[#c0cada]">{t("introduction")}</p>
          <p className="mt-4 text-sm text-[#536174] dark:text-[#c0cada]">{t("provisional")}</p>
        </div>
        <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 rounded-3xl border border-[#e3e7e9] bg-white px-5 py-2 shadow-[0_12px_30px_#18243a12] dark:border-[#34445c] dark:bg-[#172442] sm:px-8">
          <Accordion type="single" collapsible defaultValue="question1" dir={isArabic ? "rtl" : "ltr"}>
            {([1, 2, 3, 4, 5, 6] as const).map((number) => (
              <AccordionItem key={number} value={`question${number}`}>
                <AccordionTrigger><span className={`text-lg leading-snug lg:text-xl ${isArabic ? "[font-family:var(--font-noto-arabic),sans-serif]" : "font-hero-display font-normal"}`}>{t(`question${number}`)}</span></AccordionTrigger>
                <AccordionContent><span className="text-base leading-7">{t(`answer${number}`)}</span></AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <div className="rounded-3xl bg-[#f7efed] p-6 dark:bg-[#172442] lg:col-start-1 lg:row-start-2 lg:rounded-none lg:border-t lg:border-[#e3e7e9] lg:bg-transparent lg:px-0 lg:dark:bg-transparent">
          <h3 className="text-2xl font-semibold">{t("consultationHeading")}</h3>
          <p className="mt-3 text-base leading-7 text-[#536174] dark:text-[#c0cada]">{t("consultationSupport")}</p>
          <div className="mt-5 grid lg:inline-grid">
            <Button asChild><a href={HERO_ACTIONS.primary}>{tHeader("cta")}</a></Button>
          </div>
        </div>
      </div>
    </section>
  );
}
