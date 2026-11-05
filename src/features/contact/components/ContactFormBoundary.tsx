"use client";

import Script from "next/script";
import { useTranslations } from "next-intl";
import { useContactForm } from "@/features/contact/hooks/useContactForm";
import type { ContactFormBoundaryProps } from "@/features/contact/types/contact.types";
import { ContactForm } from "./ContactForm";

export function ContactFormBoundary({ config, locale }: ContactFormBoundaryProps) {
  const t = useTranslations("contact");
  const form = useContactForm(config, locale);
  const { successToast, captchaConfigured, captchaBypass, captchaAttempt, setCaptchaState } = form;

  return (
    <>
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
      <ContactForm config={config} locale={locale} form={form} />
    </>
  );
}
