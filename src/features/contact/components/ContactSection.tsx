"use client";

import Script from "next/script";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { contactTrustIcons } from "@/features/contact/constants/contact.constants";
import { useContactForm } from "@/features/contact/hooks/useContactForm";
import type { ContactSectionProps } from "@/features/contact/types/contact.types";
import { ContactForm } from "./ContactForm";
import { ContactInformation } from "./ContactInformation";

export function ContactSection({ config }: ContactSectionProps) {
  const t = useTranslations("contact");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const form = useContactForm(config, locale);
  const {
    successToast,
    captchaConfigured,
    captchaBypass,
    captchaAttempt,
    setCaptchaState,
  } = form;

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="relative isolate scroll-mt-16 overflow-hidden lg:scroll-mt-20 bg-background py-16 text-foreground lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-52 -top-52 -z-10 size-[34rem] rounded-full border-[5rem] border-secondary/50"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-72 -start-72 -z-10 size-[34rem] rounded-full border-[5rem] border-secondary/40"
      />
      <div
        role="status"
        aria-live="polite"
        className={
          successToast
            ? "fixed bottom-4 end-4 z-50 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-card px-5 py-4 text-sm text-foreground shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2"
            : "sr-only"
        }
      >
        {successToast ? t("success") : ""}
      </div>
      {captchaConfigured && !captchaBypass && (
        <Script
          key={captchaAttempt}
          id={`contact-recaptcha-${captchaAttempt}`}
          src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(config.captcha.siteKey)}${captchaAttempt ? `&contact_retry=${captchaAttempt}` : ""}`}
          strategy="afterInteractive"
          onReady={() => setCaptchaState("ready")}
          onError={() => setCaptchaState("error")}
        />
      )}
      <div className="mx-auto grid max-w-7xl min-w-0 items-start gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-x-12 lg:px-8">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <p className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[.2em] text-muted-foreground before:h-px before:w-12 before:shrink-0 before:bg-primary before:content-['']">
            {t("eyebrow")}
          </p>
          <h2
            id="contact-heading"
            className={`mt-5 text-balance text-[clamp(2.25rem,5vw,4.5rem)] font-normal ${locale === "ar" ? "[font-family:var(--font-noto-arabic),sans-serif] leading-snug" : "font-hero-display leading-[1.05]"}`}
          >
            {t("heading")}
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t("introduction")}
          </p>
        </div>
        <ul className="grid min-w-0 gap-5 sm:grid-cols-3 lg:col-start-1 lg:row-start-2">
          {(["trustChoice", "trustConsent", "trustContact"] as const).map(
            (key) => (
              <li key={key} className="text-center text-sm leading-relaxed">
                <Image
                  src={contactTrustIcons[key]}
                  alt=""
                  width={32}
                  height={32}
                  className="mx-auto mb-3 size-8"
                />
                <h3 className="font-semibold">{t(`${key}Title`)}</h3>
                <p className="mt-2 text-muted-foreground">{t(key)}</p>
              </li>
            ),
          )}
        </ul>
        <ContactForm config={config} locale={locale} form={form} />
        <ContactInformation config={config} locale={locale} />
      </div>
    </section>
  );
}
