import Link from "next/link";
import Image, { getImageProps } from "next/image";
import { ArrowRight, BedDouble, Coins, Plane, ShieldPlus, Trophy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import desktopArtwork from "../assets/images/why-turkey-desktop-image.png";
import mobileArtwork from "../assets/images/why-turkey-mobile-image.png";
import {
  WHY_TURKEY_CERTIFICATE_MARKS,
  WHY_TURKEY_HOSPITAL_IMAGE,
  WHY_TURKEY_TRUST_MARKS,
} from "@/features/landing/constants/why-turkey.constants";

const artwork = {
  desktop: desktopArtwork,
  mobile: mobileArtwork,
} as const;

const benefits = [
  { key: "benefitCapital", icon: Trophy },
  { key: "benefitHealthcare", icon: ShieldPlus },
  { key: "benefitValue", icon: Coins },
  { key: "benefitRecovery", icon: BedDouble },
] as const;

export function WhyTurkeySection() {
  const t = useTranslations("whyTurkey");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const mobileImage = getImageProps({ ...artwork.mobile, alt: "", sizes: "(max-width: 1023px) 100vw, 0px", loading: "lazy" }).props;
  const desktopImage = getImageProps({ ...artwork.desktop, alt: "", sizes: "100vw", loading: "lazy" }).props;

  return (
    <section
      id="why-turkey"
      lang={locale}
      dir={isArabic ? "rtl" : "ltr"}
      className="relative isolate overflow-hidden bg-[#f8faf8] text-[#0b132b] max-lg:bg-[#fffdfa] dark:bg-[#111d3a] dark:text-[#f8faf8] max-lg:dark:bg-[#111d3a]"
      aria-labelledby="why-turkey-heading"
    >
      <div className="relative z-0 mx-auto grid w-full max-w-7xl gap-0 px-4 py-[clamp(3.5rem,8vw,8rem)] min-[481px]:px-6 max-lg:pt-4 max-lg:pb-12 lg:grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-x-[clamp(2rem,5vw,5.5rem)] xl:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] xl:px-8">
        <div className="relative z-10 lg:contents">
          <p className={`flex items-center gap-[.7rem] text-xs font-bold text-[#536174] before:h-px before:w-[2.2rem] before:bg-crimson-600 before:content-[''] dark:text-[#c0cada] lg:col-span-2 lg:row-start-1 ${isArabic ? "tracking-normal" : "tracking-[.18em]"}`}>{t("eyebrow")}</p>
          <h2
            id="why-turkey-heading"
            className={`mt-4 max-w-[15ch] text-balance text-[clamp(2.5rem,5vw,4.5rem)] font-normal max-lg:max-w-none max-lg:text-[clamp(2.5rem,8vw,3rem)] lg:col-span-2 lg:row-start-2 lg:mt-3 lg:mb-5 lg:max-w-none lg:text-[clamp(2.4rem,4.1vw,4.5rem)] ${isArabic ? "[font-family:var(--font-noto-arabic),sans-serif] leading-[1.4]" : "font-hero-display leading-[1.08]"}`}
          >
            <span className="block">{t("headingLead")}</span>
            <span className={`mt-[.25em] block font-sans text-[.55em] leading-[1.3] font-semibold tracking-normal max-lg:mt-[.1em] max-lg:text-[.92em] lg:mt-[.35rem] lg:text-[clamp(1.25rem,2vw,2.5rem)] ${isArabic ? "max-lg:[font-family:var(--font-noto-arabic),sans-serif] max-lg:leading-[1.4]" : "max-lg:font-hero-display max-lg:leading-[1.08] max-lg:font-normal lg:whitespace-nowrap"}`}>{t("headingSubtitle")}</span>
          </h2>
          <p className="mt-5 max-w-2xl text-[clamp(1rem,1.35vw,1.25rem)] leading-[1.7] text-[#536174] dark:text-[#c0cada] max-lg:leading-[1.55] lg:col-start-1 lg:row-start-3 lg:mt-0">{t("introduction")}</p>
          <ul className="my-8 grid grid-cols-2 gap-x-[.65rem] gap-y-4 p-0 min-[481px]:max-lg:gap-x-4 min-[481px]:max-lg:gap-y-6 max-lg:my-5 lg:col-start-1 lg:row-start-4 lg:gap-x-7 lg:gap-y-6">
            {benefits.map(({ key, icon: Icon }) => (
              <li key={key} className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-[.45rem] min-[481px]:max-lg:grid-cols-[3.75rem_minmax(0,1fr)] min-[481px]:max-lg:gap-[.7rem] lg:grid-cols-[2rem_minmax(0,1fr)] lg:gap-[.8rem]">
                <Icon aria-hidden="true" className="size-9 rounded-[.8rem] bg-[#fff0ef] p-[.55rem] text-crimson-600 [stroke-width:1.6] min-[481px]:max-lg:size-[3.75rem] min-[481px]:max-lg:rounded-[1.2rem] min-[481px]:max-lg:p-[.9rem] lg:mt-[.2rem] lg:size-[1.35rem] lg:rounded-none lg:bg-transparent lg:p-0" />
                <div>
                  <h3 className="m-0 text-[.8rem] leading-[1.3] font-bold min-[481px]:max-lg:text-[.92rem] min-[481px]:max-lg:leading-[1.4] lg:text-base lg:leading-[1.4]">{t(`${key}Title`)}</h3>
                  <p className="mt-1 text-xs leading-[1.4] text-[#536174] dark:text-[#c0cada] min-[481px]:max-lg:mt-[.35rem] min-[481px]:max-lg:text-[.82rem] min-[481px]:max-lg:leading-[1.5] lg:mt-[.35rem] lg:text-[.9rem] lg:leading-[1.6]">{t(`${key}Body`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative isolate min-w-0 mt-0 lg:contents">
          <picture className="absolute inset-0 -z-10 block h-[71vw] max-h-[42rem] overflow-hidden rounded-3xl bg-[#e9e2d8] min-[481px]:max-lg:rounded-[1.25rem] lg:right-auto lg:bottom-0 lg:left-1/2 lg:h-auto lg:w-screen lg:max-h-none lg:-translate-x-1/2 lg:rounded-none">
            <source media="(min-width: 1024px)" srcSet={desktopImage.srcSet} sizes={desktopImage.sizes} width={artwork.desktop.width} height={artwork.desktop.height} />
            <img {...mobileImage} className="block h-full w-full object-cover object-center rtl:-scale-x-100" alt="" aria-hidden="true" />
          </picture>
          <div className="relative grid grid-cols-1 gap-[.2rem] px-[.9rem] pt-[50vw] pb-0 lg:col-start-2 lg:row-start-3 lg:row-span-4 lg:self-end lg:gap-4 lg:px-0 lg:py-4" role="group" aria-label={t("cardsLabel")}>
            <article className="relative min-w-0 w-full justify-self-end rounded-[1.25rem] border border-[#e3e7e9] bg-white p-[.9rem] shadow-[0_12px_30px_#18243a12] dark:border-[#34445c] dark:bg-[#172442] min-[481px]:p-4 max-lg:grid max-lg:grid-cols-[minmax(5.5rem,30%)_minmax(0,1fr)] max-lg:items-start max-lg:gap-x-[.85rem] max-lg:gap-y-[.45rem] max-lg:justify-self-stretch lg:w-[66%]">
              <Image className="hidden max-lg:block max-lg:aspect-[156/113] max-lg:h-auto max-lg:w-full max-lg:rounded-xl max-lg:object-cover" {...WHY_TURKEY_HOSPITAL_IMAGE} alt="" aria-hidden="true" />
              <div className="min-w-0 max-lg:pe-[1.8rem]">
                <h3 className={`m-0 text-[clamp(1.05rem,1.65vw,1.4rem)] leading-[1.2] font-normal ${isArabic ? "[font-family:var(--font-noto-arabic),sans-serif] leading-[1.5]" : "max-w-[15ch] font-hero-display"}`}>{t("cardAccreditationTitle")}</h3>
                <p className="mt-[.35rem] text-[.9rem] leading-[1.6] text-[#536174] dark:text-[#c0cada] lg:text-[.8rem]">{t("cardAccreditationBody")}</p>
              </div>
              <span className="absolute top-4 end-4 grid size-[1.9rem] place-items-center rounded-full bg-[#f7f5f3] dark:bg-[#263650]" aria-hidden="true"><ArrowRight className="size-4 rtl:-scale-x-100" /></span>
              <ul className="mt-[.8rem] grid grid-cols-3 border-t border-[#e3e7e9] pt-[.8rem] dark:border-[#34445c] max-lg:col-span-2 max-lg:mt-0 max-lg:border-t-0 max-lg:pt-[.35rem]" aria-label={t("marksLabel")}>
                {WHY_TURKEY_CERTIFICATE_MARKS.map(({ src, width, height, labelKey }, index) => (
                  <li key={labelKey} className={`flex min-w-0 items-center justify-center gap-[.35rem] px-[.2rem] text-[.6rem] leading-[1.35] min-[481px]:px-[.35rem] min-[481px]:max-lg:text-[.55rem] lg:text-[.68rem] ${index > 0 ? "border-s border-[#e3e7e9] dark:border-[#34445c]" : ""}`}>
                    <Image className={`h-11 w-[min(100%,3rem)] flex-[0_1_auto] object-contain min-[481px]:h-12 ${labelKey === "markMinistry" ? "w-[min(45%,3rem)]" : ""}`} src={src} width={width} height={height} alt={labelKey === "markMinistry" ? "" : t(labelKey)} />
                    {labelKey === "markMinistry" && <span className="min-w-0">{t(labelKey)}</span>}
                  </li>
                ))}
              </ul>
            </article>
            <div className="min-w-0 w-full justify-self-end rounded-[1.25rem] border border-[#e3e7e9] bg-white p-[.7rem] shadow-[0_12px_30px_#18243a12] dark:border-[#34445c] dark:bg-[#172442] min-[481px]:p-[.8rem] lg:w-[78%]">
              <article className="relative grid grid-cols-[minmax(6rem,30%)_minmax(0,1fr)] items-center gap-[.65rem] min-[481px]:gap-[.85rem]">
                <Image className="block aspect-[156/113] h-auto w-full rounded-xl object-cover max-lg:aspect-[1.85]" {...WHY_TURKEY_HOSPITAL_IMAGE} alt="" aria-hidden="true" />
                <div>
                  <h3 className={`m-0 pe-8 text-[clamp(1.05rem,1.65vw,1.4rem)] leading-[1.2] font-normal ${isArabic ? "[font-family:var(--font-noto-arabic),sans-serif] leading-[1.5]" : "font-hero-display"}`}>{t("cardHospitalsTitle")}</h3>
                  <p className="mt-[.35rem] text-[.9rem] leading-[1.6] text-[#536174] dark:text-[#c0cada] lg:text-[.8rem]">{t("cardHospitalsBody")}</p>
                </div>
                <span className="absolute top-0 end-0 grid size-[1.9rem] place-items-center rounded-full bg-[#f7f5f3] dark:bg-[#263650]" aria-hidden="true"><ArrowRight className="size-4 rtl:-scale-x-100" /></span>
              </article>
              <article className="mt-[.8rem] grid grid-cols-[2rem_minmax(0,1fr)_1rem] items-center gap-[.65rem] rounded-2xl border border-[#f2d9de] bg-[#fff5f6] p-[.7rem] dark:border-[#78404d] dark:bg-[#2a1d2a] min-[481px]:p-[.8rem]">
                <Plane className="size-6 justify-self-center text-crimson-600" aria-hidden="true" />
                <div>
                  <h3 className="m-0 text-base leading-[1.4] font-bold">{t("cardLicenseTitle")}</h3>
                  <p className="mt-[.35rem] text-[.9rem] leading-[1.6] text-[#536174] dark:text-[#c0cada] lg:text-[.8rem]">{t("cardLicenseBody")}</p>
                </div>
                <ArrowRight className="size-4 justify-self-center text-crimson-600 rtl:-scale-x-100" aria-hidden="true" />
              </article>
            </div>
          </div>
        </div>
        <ul className="my-8 grid grid-cols-3 gap-3 border-y border-[#d9e0e5] py-5 dark:border-[#34445c] max-lg:gap-[.65rem] lg:col-start-1 lg:row-start-5" aria-label={t("trustLabel")}>
          <li className="flex min-w-0 items-center gap-[.55rem] text-[.8rem] leading-[1.5] font-semibold text-[#34445c] [overflow-wrap:anywhere] dark:text-[#e2e8f0] max-lg:gap-[.35rem] max-lg:text-[.7rem] max-lg:leading-[1.35] max-[360px]:flex-col max-[360px]:items-start"><Image className="size-6 shrink-0 object-contain max-lg:size-5" src={WHY_TURKEY_CERTIFICATE_MARKS[0].src} width={28} height={28} alt="" aria-hidden="true" />{t("trustHospitals")}</li>
          <li className="flex min-w-0 items-center gap-[.55rem] text-[.8rem] leading-[1.5] font-semibold text-[#34445c] [overflow-wrap:anywhere] dark:text-[#e2e8f0] max-lg:gap-[.35rem] max-lg:text-[.7rem] max-lg:leading-[1.35] max-[360px]:flex-col max-[360px]:items-start"><Image className="size-6 shrink-0 object-contain max-lg:size-5" src={WHY_TURKEY_TRUST_MARKS.specialist.src} width={28} height={28} alt="" aria-hidden="true" />{t("trustSpecialist")}</li>
          <li className="flex min-w-0 items-center gap-[.55rem] text-[.8rem] leading-[1.5] font-semibold text-[#34445c] [overflow-wrap:anywhere] dark:text-[#e2e8f0] max-lg:gap-[.35rem] max-lg:text-[.7rem] max-lg:leading-[1.35] max-[360px]:flex-col max-[360px]:items-start"><Image className="size-6 shrink-0 object-contain max-lg:size-5" src={WHY_TURKEY_TRUST_MARKS.support.src} width={28} height={28} alt="" aria-hidden="true" />{t("trustSupport")}</li>
        </ul>
        <Link className="inline-flex min-h-12 items-center justify-center justify-self-start rounded-full bg-crimson-600 px-5 py-3 text-[.8rem] font-bold tracking-[.08em] text-white no-underline hover:bg-crimson-700 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-midnight-900 motion-safe:transition-colors motion-safe:duration-[160ms] lg:col-start-1 lg:row-start-6" href="#about-us">{t("cta")}</Link>
      </div>
    </section>
  );
}
