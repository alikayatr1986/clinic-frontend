"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import type { ReactNode } from "react";
import { contactMethodIcons } from "@/features/contact/constants/contact.constants";
import { ContactPhoneInput } from "./ContactPhoneInput";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ContactCopyKey, ContactMethod, ContactValues, ContactFormProps } from "@/features/contact/types/contact.types";

const contactMethods: ContactMethod[] = ["email", "phone_call", "whatsapp", "telegram"];

export function ContactForm({ config, locale, form }: ContactFormProps) {
  const t = useTranslations("contact");
  const { procedures, catalogError, consent, consentError, consentRefreshing, submitMutation, values, accepted, errors, setErrors, status, captchaPending, captchaState, setCaptchaState, setCaptchaAttempt, summary, captchaConfigured, captchaBypass, captchaReady, locationsAvailable, telephoneDraft, dialCountries, dialCountry, busy, success, setAccepted, change, changeMethod, changeEmail, changePhone, changeDialCountry, retryDependencies, submit } = form;
  const activeProcedures = procedures.filter((item) => item.status !== "retired" && !item.retired);
  function field(
    key: keyof ContactValues,
    control: ReactNode,
    help?: ContactCopyKey,
  ) {
    return (
      <div className="grid min-w-0 content-start gap-2">
        <Label htmlFor={`contact-${key}`}>
          {t(key)}
          {key !== "message" && (
            <span aria-hidden="true" className="text-primary">
              *
            </span>
          )}
        </Label>
        {control}
        {help && (
          <p
            id={`contact-${key}-help`}
            className="text-sm leading-relaxed text-muted-foreground"
          >
            {t(help)}
          </p>
        )}
        {errors[key] && (
          <p id={`contact-${key}-error`} className="text-sm text-destructive">
            {t(errors[key])}
          </p>
        )}
      </div>
    );
  }

  function attributes(key: keyof ContactValues, help = false) {
    return {
      id: `contact-${key}`,
      name: key,
      required: key !== "message",
      "aria-invalid": Boolean(errors[key]),
      "aria-describedby":
        [
          help ? `contact-${key}-help` : "",
          errors[key] ? `contact-${key}-error` : "",
        ]
          .filter(Boolean)
          .join(" ") || undefined,
    };
  }

  return (
        <div className="min-w-0 rounded-2xl border border-border/50 bg-card p-5 shadow-xl shadow-foreground/5 sm:p-8 lg:col-start-2 lg:row-span-4 lg:row-start-1">
          <form
            noValidate
            onSubmit={submit}
            aria-label={t("formTitle")}
            aria-busy={busy}
          >
            <div
              ref={summary}
              tabIndex={-1}
              role={success ? "status" : "alert"}
              aria-live="polite"
              className={status === "validationSummary" ? "sr-only" : `break-words rounded-lg focus-visible:outline-2 focus-visible:outline-ring ${status ? "mb-5 border border-border bg-secondary p-4" : ""}`}
            >
              {status && <p>{t(status)}</p>}
            </div>
            {consentError || catalogError ? (
              <div className="mb-5 grid gap-3" role="alert">
                <p>{t("dependenciesUnavailable")}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={retryDependencies}
                >
                  {t("retry")}
                </Button>
              </div>
            ) : (
              (!consent || !activeProcedures.length) && (
                <p role="status" className="mb-5 text-sm">
                  {t("loading")}
                </p>
              )
            )}
            <fieldset disabled={busy} className="grid min-w-0 gap-5">
              <legend className="sr-only">{t("formTitle")}</legend>
              {field(
                "name",
                <Input
                  {...attributes("name")}
                  autoComplete="name"
                  maxLength={200}
                  value={values.name}
                  onChange={(event) => change("name", event.target.value)}
                />,
              )}
              {field(
                "country",
                <Select
                    {...attributes("country", !locationsAvailable)}
                    autoComplete="country"
                    value={values.country}
                    disabled={!locationsAvailable}
                    onChange={(event) => change("country", event.target.value)}
                  >
                    <option value="">{t("selectCountry")}</option>
                    {config.countries.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item[locale]}
                      </option>
                    ))}
                </Select>,
                !locationsAvailable ? "locationsUnavailable" : undefined,
              )}
              <fieldset
                id="contact-preferred_contact"
                aria-describedby={[values.preferred_contact === "email" ? "contact-preference-help" : "", errors.preferred_contact ? "contact-preferred_contact-error" : ""].filter(Boolean).join(" ") || undefined}
                className="min-w-0"
              >
                <legend className="mb-3 text-sm font-medium">
                  {t("preferred_contact")}{" "}
                  <span aria-hidden="true" className="text-primary">
                    *
                  </span>
                </legend>
                <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                  {contactMethods.map((method) => (
                    <label
                      key={method}
                      className={`flex min-h-12 min-w-0 cursor-pointer items-center justify-center gap-2 rounded-md border px-2 py-3 text-sm has-focus-visible:ring-2 has-focus-visible:ring-ring ${values.preferred_contact === method ? "border-primary bg-primary/5" : "border-input"}`}
                    >
                      <input
                        type="radio"
                        name="preferred_contact"
                        value={method}
                        checked={values.preferred_contact === method}
                        required
                        onChange={() => changeMethod(method)}
                        className="sr-only"
                      />
                      <Image src={contactMethodIcons[method]} alt="" width={20} height={20} aria-hidden="true" className="dark:invert dark:hue-rotate-180" />
                      <span className="break-words">
                        {t(`methods.${method}`)}
                      </span>
                    </label>
                  ))}
                </div>
                {values.preferred_contact === "email" && (
                  <p
                    id="contact-preference-help"
                    aria-live="polite"
                    className="mt-2 text-sm leading-relaxed text-muted-foreground"
                  >
                    {t("emailPreferenceHelp")}
                  </p>
                )}
                {errors.preferred_contact && (
                  <p
                    id="contact-preferred_contact-error"
                    className="text-sm text-destructive"
                  >
                    {t(errors.preferred_contact)}
                  </p>
                )}
              </fieldset>
              {values.preferred_contact === "email" ? (
                field(
                  "email",
                  <Input
                    {...attributes("email")}
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    dir="ltr"
                    value={values.email}
                    onChange={(event) => changeEmail(event.target.value)}
                  />,
                )
              ) : (
                <div className="grid min-w-0 content-start gap-2">
                  <Label htmlFor="contact-phone">
                    {t("phone")}
                    <span aria-hidden="true" className="text-primary">
                      *
                    </span>
                  </Label>
                  <ContactPhoneInput
                    id="contact-phone"
                    name="phone"
                    value={values.phone}
                    country={dialCountry?.dialRegion}
                    defaultCountry={dialCountry?.dialRegion}
                    countries={dialCountries}
                    selectedDialCountry={telephoneDraft?.dialCountry ?? ""}
                    locale={locale}
                    selectCountryLabel={t("selectDialCountry")}
                    disabled={busy}
                    required
                    hasError={Boolean(errors.phone || errors.dial_country)}
                    countryAriaLabel={t("dial_country")}
                    inputAriaLabel={t("phone")}
                    ariaDescribedBy={
                      [
                        errors.phone ? "contact-phone-error" : "",
                        errors.dial_country ? "contact-dial_country-error" : "",
                      ]
                        .filter(Boolean)
                        .join(" ") || undefined
                    }
                    onChange={(val) => changePhone(val)}
                    onCountryChange={(code) => changeDialCountry(code)}
                  />
                  {errors.dial_country && (
                    <p
                      id="contact-dial_country-error"
                      className="text-sm text-destructive"
                    >
                      {t(errors.dial_country)}
                    </p>
                  )}
                  {errors.phone && (
                    <p
                      id="contact-phone-error"
                      className="text-sm text-destructive"
                    >
                      {t(errors.phone)}
                    </p>
                  )}
                </div>
              )}
              {field(
                "procedure",
                <Select
                    {...attributes("procedure")}
                    disabled={!activeProcedures.length || catalogError}
                    value={values.procedure}
                    onChange={(event) => change("procedure", event.target.value)}
                  >
                    <option value="">{t("selectProcedure")}</option>
                    {activeProcedures.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item[locale]}
                      </option>
                    ))}
                </Select>,
              )}
              {field(
                "message",
                <Textarea
                  {...attributes("message")}
                  rows={3}
                  maxLength={5000}
                  value={values.message}
                  onChange={(event) => change("message", event.target.value)}
                />,
              )}
              <div className="grid gap-2">
                <label
                  className="flex min-h-12 cursor-pointer items-start gap-3 py-2 text-sm leading-relaxed"
                  htmlFor="contact-consent_accepted"
                >
                  <input
                    id="contact-consent_accepted"
                    type="checkbox"
                    name="consent_accepted"
                    checked={accepted}
                    required
                    disabled={!consent || consentError || consentRefreshing}
                    onChange={(event) => {
                      setAccepted(event.target.checked);
                      setErrors((previous) => ({
                        ...previous,
                        consent_accepted: undefined,
                      }));
                    }}
                    aria-invalid={Boolean(errors.consent_accepted)}
                    aria-describedby={
                      [
                        errors.consent_accepted
                          ? "contact-consent_accepted-error"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ") || undefined
                    }
                    className="mt-1 size-5 shrink-0 accent-primary"
                  />
                  <span>
                    {t("consent_accepted")}{" "}
                    <span aria-hidden="true" className="text-primary">
                      *
                    </span>
                  </span>
                </label>
                {consent && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button type="button" disabled={consentRefreshing || consentError} className="w-fit text-sm text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50">
                        {t("viewConsent")}
                      </button>
                    </DialogTrigger>
                    <DialogContent dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
                      <DialogTitle>{t("consentTitle")}</DialogTitle>
                      <div className="whitespace-pre-wrap break-words">
                        <DialogDescription>{consent.text}</DialogDescription>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {errors.consent_accepted && (
                  <p
                    id="contact-consent_accepted-error"
                    className="text-sm text-destructive"
                  >
                    {t(errors.consent_accepted)}
                  </p>
                )}
              </div>
              <div className="grid">
                <Button
                  type="submit"
                  size="hero"
                  disabled={
                    busy ||
                    !consent ||
                    consentError ||
                    catalogError ||
                    !activeProcedures.length ||
                    !locationsAvailable ||
                    !captchaReady ||
                    success
                  }
                >
                  {t(
                    captchaPending || submitMutation.isPending
                      ? "submitting"
                      : "submit",
                  )}
                </Button>
              </div>
            </fieldset>
            {!captchaBypass && (!captchaConfigured || captchaState === "error") ? (
              <div className="mt-4 grid gap-3" role="status">
                <p className="text-sm text-destructive">
                  {t("captchaUnavailable")}
                </p>
                {captchaConfigured && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCaptchaState("loading");
                      setCaptchaAttempt((value) => value + 1);
                    }}
                  >
                    {t("retryCaptcha")}
                  </Button>
                )}
              </div>
            ) : (
              !captchaBypass && captchaState === "loading" && (
                <p role="status" className="mt-3 text-sm text-muted-foreground">
                  {t("captchaLoading")}
                </p>
              )
            )}
          </form>
        </div>

  );
}
