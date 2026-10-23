import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "next-intl";

import { TREATMENT_SERVICES, TREATMENT_SERVICES_ACTIONS, TREATMENT_SERVICES_ARTWORK, TREATMENT_SERVICES_DOCTOR_MARK, TREATMENT_SERVICES_TRUST } from "@/features/landing/constants/treatment-services.constants";

export function TreatmentServicesSection() {
  const t = useTranslations("treatmentServices");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const mobileImage = getImageProps({
    ...TREATMENT_SERVICES_ARTWORK.mobile,
    alt: "",
    sizes: "100vw",
    loading: "lazy",
  }).props;
  const desktopImage = getImageProps({
    ...TREATMENT_SERVICES_ARTWORK.desktop,
    alt: "",
    sizes: "100vw",
    loading: "lazy",
  }).props;

  return (
    <section
      id="treatments"
      aria-labelledby="treatment-services-heading"
      lang={locale}
      dir={isArabic ? "rtl" : "ltr"}
      className="relative isolate scroll-mt-16 overflow-x-clip bg-background text-foreground lg:scroll-mt-20"
    >
      <div className="relative mx-auto grid max-w-7xl min-w-0 lg:min-h-[clamp(34rem,50vw,46rem)] lg:grid-cols-2 lg:items-start lg:px-8 lg:py-16">
        <div className="relative z-10 min-w-0 px-4 pt-12 pb-8 [overflow-wrap:anywhere] min-[481px]:px-6 lg:col-start-1 lg:row-start-1 lg:px-0 lg:py-0 lg:pe-8">
          <p className={`flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground before:h-px before:w-10 before:shrink-0 before:bg-primary before:content-[''] ${isArabic ? "tracking-normal" : "tracking-[.18em]"}`}>
            {t("eyebrow")}
          </p>
          <h2
            id="treatment-services-heading"
            className={`mt-5 text-balance text-[clamp(2.25rem,6vw,3.75rem)] font-normal ${isArabic ? "[font-family:var(--font-noto-arabic),sans-serif] leading-[1.45]" : "font-hero-display leading-[1.08]"}`}
          >
            {t("heading")}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground lg:text-lg">
            {t("introduction")}
          </p>
        </div>

        <div className="relative min-w-0 lg:static lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:flex lg:h-full lg:items-end lg:justify-end lg:pt-80">
          <picture className="block aspect-[1/1.15] overflow-hidden lg:absolute lg:inset-y-0 lg:left-1/2 lg:-z-10 lg:aspect-auto lg:w-screen lg:-translate-x-1/2">
            <source
              media="(min-width: 1024px)"
              srcSet={desktopImage.srcSet}
              sizes={desktopImage.sizes}
              width={TREATMENT_SERVICES_ARTWORK.desktop.width}
              height={TREATMENT_SERVICES_ARTWORK.desktop.height}
            />
            <img
              {...mobileImage}
              alt=""
              aria-hidden="true"
              className="block h-full w-full object-cover object-bottom rtl:-scale-x-100 lg:object-center dark:lg:brightness-[.2]"
            />
          </picture>
          <article
            aria-labelledby="treatment-services-profile-name"
            className="relative z-10 mx-4 -mt-12 mb-12 grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-lg [overflow-wrap:anywhere] min-[481px]:mx-6 min-[481px]:grid-cols-[3.875rem_minmax(0,1fr)] min-[481px]:gap-5 min-[481px]:p-6 lg:m-0 lg:w-full lg:max-w-md"
          >
            <Image {...TREATMENT_SERVICES_DOCTOR_MARK} alt="" aria-hidden="true" className="h-auto w-full" />
            <div className="min-w-0 border-s border-border ps-3 min-[481px]:ps-5">
              <p className={`text-xs font-semibold text-muted-foreground ${isArabic ? "tracking-normal" : "tracking-[.16em]"}`}>
                {t("profileEyebrow")}
              </p>
              <h3
                id="treatment-services-profile-name"
                className={`mt-2 text-2xl font-normal ${isArabic ? "[font-family:var(--font-noto-arabic),sans-serif] leading-relaxed" : "font-hero-display leading-tight"}`}
              >
                {t("profileName")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t("profileSpecialty")}
              </p>
            </div>
          </article>
        </div>

        <div className="relative z-10 min-w-0 px-4 pb-12 [overflow-wrap:anywhere] min-[481px]:px-6 lg:col-start-1 lg:row-start-2 lg:mt-8 lg:px-0 lg:pb-0 lg:pe-8">
          <ul aria-label={t("servicesLabel")} data-treatment-services="" className="grid grid-cols-2 gap-3 lg:gap-x-5 lg:gap-y-7">
            {TREATMENT_SERVICES.map(({ key, image }) => (
              <li key={key} className="flex min-w-0 items-center gap-2 rounded-2xl border border-border bg-card p-2 min-[375px]:gap-2.5 sm:gap-4 sm:p-4 lg:items-start lg:gap-3 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
                <Image {...image} alt="" aria-hidden="true" sizes="(min-width: 640px) and (max-width: 1023px) 56px, (min-width: 1024px) 48px, (min-width: 375px) 36px, 32px" className="size-8 shrink-0 rounded-full object-contain min-[375px]:size-9 sm:size-14 lg:size-12" />
                <div className="min-w-0">
                  <h3 className="text-[.8125rem] font-medium leading-snug sm:text-base">{t(`services.${key}.title`)}</h3>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm sm:leading-relaxed">{t(`services.${key}.description`)}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid min-w-0 grid-cols-1 gap-3 lg:mt-8 lg:grid-cols-2" data-treatment-actions="">
            <Button asChild size="hero">
              <Link href={TREATMENT_SERVICES_ACTIONS.primary}><span className="min-w-0">{t("primaryAction")}</span><ArrowRight aria-hidden="true" className="rtl:-scale-x-100" /></Link>
            </Button>
            <Button asChild size="hero" variant="outline">
              <Link href={TREATMENT_SERVICES_ACTIONS.secondary}><span className="min-w-0">{t("secondaryAction")}</span><ArrowRight aria-hidden="true" className="rtl:-scale-x-100" /></Link>
            </Button>
          </div>
        </div>
      </div>
      <div data-treatment-trust="" className="relative bg-midnight-900 text-midnight-50">
        <ul aria-label={t("trustLabel")} className="mx-auto grid max-w-7xl min-w-0 px-4 py-3 min-[481px]:px-6 lg:grid-cols-3 lg:px-8 lg:py-8">
          {TREATMENT_SERVICES_TRUST.map(({ key, icon: Icon }, index) => (
            <li key={key} className={`flex min-w-0 items-start gap-4 py-6 [overflow-wrap:anywhere] lg:px-6 lg:py-0 ${index > 0 ? "border-t border-midnight-500 lg:border-t-0 lg:border-s" : "lg:ps-0"}`}>
              <Icon aria-hidden="true" focusable="false" className="size-9 shrink-0 text-midnight-100" />
              <div className="min-w-0">
                <h3 className={`text-xl font-normal ${isArabic ? "[font-family:var(--font-noto-arabic),sans-serif] leading-relaxed" : "font-hero-display leading-snug"}`}>{t(`trust.${key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-midnight-100">{t(`trust.${key}.description`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
