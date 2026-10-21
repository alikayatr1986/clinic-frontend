import Link from "next/link";
import Image, { getImageProps } from "next/image";
import { ArrowRight, BedDouble, Coins, Plane, ShieldPlus, Trophy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import mobileArtwork from "../../../../public/images/landing/why-turkey-mobile-image.png";
import {
  WHY_TURKEY_CERTIFICATE_MARKS,
  WHY_TURKEY_HOSPITAL_IMAGE,
  WHY_TURKEY_TRUST_MARKS,
} from "@/features/landing/constants/why-turkey.constants";
import "@/features/landing/styles/why-turkey.styles.css";

const artwork = {
  desktop: { src: "/images/landing/why-turkey-desktop-image.png", width: 1983, height: 793 },
  mobile: { src: mobileArtwork, width: 1391, height: 1024 },
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
    <section id="why-turkey" lang={locale} dir={isArabic ? "rtl" : "ltr"} className="why-turkey" aria-labelledby="why-turkey-heading">
      <div className="why-turkey-inner">
        <div className="why-turkey-copy">
          <p className="why-turkey-eyebrow">{t("eyebrow")}</p>
          <h2 id="why-turkey-heading" className="why-turkey-heading">
            <span className="why-turkey-heading-lead">{t("headingLead")}</span>
            <span className="why-turkey-heading-subtitle">{t("headingSubtitle")}</span>
          </h2>
          <p className="why-turkey-intro">{t("introduction")}</p>
          <ul className="why-turkey-benefits">
            {benefits.map(({ key, icon: Icon }) => (
              <li key={key} className="why-turkey-benefit">
                <Icon aria-hidden="true" className="why-turkey-benefit-icon" />
                <div><h3>{t(`${key}Title`)}</h3><p>{t(`${key}Body`)}</p></div>
              </li>
            ))}
          </ul>
        </div>

        <div className="why-turkey-visual">
          <picture className="why-turkey-artwork">
            <source media="(min-width: 1024px)" srcSet={desktopImage.srcSet} sizes={desktopImage.sizes} width={artwork.desktop.width} height={artwork.desktop.height} />
            <img {...mobileImage} alt="" aria-hidden="true" />
          </picture>
          <div className="why-turkey-cards" role="group" aria-label={t("cardsLabel")}>
            <article className="why-turkey-card why-turkey-card-accreditation">
              <Image className="why-turkey-card-accreditation-image" {...WHY_TURKEY_HOSPITAL_IMAGE} alt="" aria-hidden="true" />
              <div className="why-turkey-card-accreditation-copy">
                <h3>{t("cardAccreditationTitle")}</h3>
                <p>{t("cardAccreditationBody")}</p>
              </div>
              <span className="why-turkey-card-arrow" aria-hidden="true"><ArrowRight /></span>
              <ul className="why-turkey-certificate-marks" aria-label={t("marksLabel")}>
                {WHY_TURKEY_CERTIFICATE_MARKS.map(({ src, width, height, labelKey }) => (
                  <li key={src}>
                    <Image src={src} width={width} height={height} alt={labelKey === "markMinistry" ? "" : t(labelKey)} />
                    {labelKey === "markMinistry" && <span>{t(labelKey)}</span>}
                  </li>
                ))}
              </ul>
            </article>
            <div className="why-turkey-card why-turkey-hospital-panel">
              <article className="why-turkey-card-hospitals">
                <Image {...WHY_TURKEY_HOSPITAL_IMAGE} alt="" aria-hidden="true" />
                <div>
                  <h3>{t("cardHospitalsTitle")}</h3>
                  <p>{t("cardHospitalsBody")}</p>
                </div>
                <span className="why-turkey-card-arrow" aria-hidden="true"><ArrowRight /></span>
              </article>
              <article className="why-turkey-card-license">
                <Plane aria-hidden="true" />
                <div>
                  <h3>{t("cardLicenseTitle")}</h3>
                  <p>{t("cardLicenseBody")}</p>
                </div>
                <ArrowRight className="why-turkey-card-license-arrow" aria-hidden="true" />
              </article>
            </div>
          </div>
        </div>
        <ul className="why-turkey-trust" aria-label={t("trustLabel")}>
          <li><Image src={WHY_TURKEY_CERTIFICATE_MARKS[0].src} width={28} height={28} alt="" aria-hidden="true" />{t("trustHospitals")}</li>
          <li><Image src={WHY_TURKEY_TRUST_MARKS.specialist.src} width={28} height={28} alt="" aria-hidden="true" />{t("trustSpecialist")}</li>
          <li><Image src={WHY_TURKEY_TRUST_MARKS.support.src} width={28} height={28} alt="" aria-hidden="true" />{t("trustSupport")}</li>
        </ul>
        <Link className="why-turkey-cta" href="#about-us">{t("cta")}</Link>
      </div>
    </section>
  );
}
