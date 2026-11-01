import { useEffect, useRef, useState, type FormEvent } from "react";
import { getDialCountries } from "@/features/contact/constants/contact.constants";
import { useProcedures } from "@/features/procedures/hooks/useProcedures";
import { validateContact } from "@/features/contact/schemas/contact.schema";
import { isAbortError } from "@/lib/api";
import { ContactApiError } from "@/features/contact/services/contact.service";
import { freshCaptchaToken } from "@/features/contact/services/captcha.service";
import { useConsent } from "@/features/contact/hooks/useConsent";
import { useSubmitContact } from "@/features/contact/hooks/useSubmitContact";
import { normalizeContactPhone } from "@/features/contact/utils/contact-phone.utils";
import type { ContactConfig, ContactCopyKey, ContactDrafts, ContactErrors, ContactMethod, ContactValues } from "@/features/contact/types/contact.types";

const emptyValues: ContactValues = {
  name: "",
  country: "",
  procedure: "",
  email: "",
  phone: "",
  preferred_contact: "email",
  message: "",
};
const emptyDrafts: ContactDrafts = {
  email: "",
  phone_call: { number: "", dialCountry: "" },
  whatsapp: { number: "", dialCountry: "" },
  telegram: { number: "", dialCountry: "" },
};

export function useContactForm(config: ContactConfig, locale: "en" | "ar") {
  const {
    procedures,
    error: catalogError,
    retry: retryCatalog,
  } = useProcedures();
  const {
    consent,
    error: consentError,
    retry: retryConsent,
    isRefreshing: consentRefreshing,
  } = useConsent(locale);
  const submitMutation = useSubmitContact();

  const [values, setValues] = useState<ContactValues>(emptyValues);
  const [drafts, setDrafts] = useState<ContactDrafts>(emptyDrafts);
  const [acceptedConsentKey, setAcceptedConsentKey] = useState<string | null>(
    null,
  );
  const consentKey = consent ? `${consent.version}\u0000${consent.text}` : null;
  const accepted = !consentRefreshing && acceptedConsentKey === consentKey;
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<ContactCopyKey | "">("");
  const [successToast, setSuccessToast] = useState(0);
  const [captchaPending, setCaptchaPending] = useState(false);
  const [captchaState, setCaptchaState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [captchaAttempt, setCaptchaAttempt] = useState(0);

  const submitting = useRef(false);
  const summary = useRef<HTMLDivElement>(null);
  const captchaConfigured = Boolean(
    config.captcha.siteKey && config.captcha.action,
  );
  const captchaBypass = config.captcha.devBypass === true;
  const captchaReady = captchaBypass || (captchaConfigured && captchaState === "ready");
  const locationsAvailable = config.countries.length > 0;
  const telephoneMethod =
    values.preferred_contact === "email" ? null : values.preferred_contact;
  const telephoneDraft = telephoneMethod ? drafts[telephoneMethod] : null;
  const dialCountries = getDialCountries(config.countries);
  const dialCountry = dialCountries.find(
    (item) => item.code === telephoneDraft?.dialCountry,
  );

  const busy = captchaPending || submitMutation.isPending || consentRefreshing;
  const success = submitMutation.isSuccess;

  function setAccepted(value: boolean) {
    setAcceptedConsentKey(value ? consentKey : null);
  }

  useEffect(() => {
    if (captchaBypass || !captchaConfigured || captchaState !== "loading") return;
    const timer = window.setTimeout(() => setCaptchaState("error"), 15000);
    return () => window.clearTimeout(timer);
  }, [captchaBypass, captchaConfigured, captchaState, captchaAttempt]);

  useEffect(() => {
    if (!successToast) return;
    const timer = window.setTimeout(() => setSuccessToast(0), 6000);
    return () => window.clearTimeout(timer);
  }, [successToast]);

  function change<K extends keyof ContactValues>(
    key: K,
    value: ContactValues[K],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
    if (key === "country") {
      const selected = String(value);
      setDrafts((previous) => ({
        ...previous,
        phone_call: { ...previous.phone_call, dialCountry: selected },
        whatsapp: { ...previous.whatsapp, dialCountry: selected },
        telegram: { ...previous.telegram, dialCountry: selected },
      }));
      setErrors((previous) => ({
        ...previous,
        dial_country: undefined,
        phone: undefined,
      }));
    }
    if (submitMutation.isSuccess) {
      submitMutation.reset();
    }
  }

  function changeMethod(method: ContactMethod) {
    setValues((previous) => ({
      ...previous,
      preferred_contact: method,
      email: method === "email" ? drafts.email : "",
      phone: method === "email" ? "" : drafts[method].number,
    }));
    setErrors((previous) => ({
      ...previous,
      email: undefined,
      phone: undefined,
      dial_country: undefined,
      preferred_contact: undefined,
    }));
  }

  function changeEmail(value: string) {
    setDrafts((previous) => ({ ...previous, email: value }));
    change("email", value);
  }

  function changePhone(value: string) {
    if (!telephoneMethod) return;
    setDrafts((previous) => ({
      ...previous,
      [telephoneMethod]: { ...previous[telephoneMethod], number: value },
    }));
    change("phone", value);
  }

  function changeDialCountry(value: string) {
    if (!telephoneMethod) return;
    setDrafts((previous) => ({
      ...previous,
      [telephoneMethod]: { ...previous[telephoneMethod], dialCountry: value },
    }));
    setErrors((previous) => ({
      ...previous,
      dial_country: undefined,
      phone: undefined,
    }));
  }

  function announce(message: ContactCopyKey) {
    setStatus(message);
    if (message !== "validationSummary") summary.current?.focus();
  }

  function focusFirstError(fieldErrors: ContactErrors) {
    requestAnimationFrame(() => {
      const order = ["name", "country", "preferred_contact", "email", "dial_country", "phone", "procedure", "message", "consent_accepted"] as const;
      const key = order.find((field) => fieldErrors[field]);
      const target = key === "preferred_contact"
        ? document.querySelector<HTMLInputElement>('#contact-preferred_contact input:checked')
        : document.getElementById(`contact-${key}`);
      if (target === document.activeElement) target?.blur();
      target?.focus();
    });
  }

  function retryDependencies() {
    setAccepted(false);
    void retryConsent();
    retryCatalog();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitMutation.reset();
    setSuccessToast(0);
    const invalid = validateContact(
      values,
      accepted,
      config.countries,
      procedures,
      telephoneDraft?.dialCountry,
      dialCountries,
    );
    setErrors(invalid);
    if (Object.keys(invalid).length) {
      announce("validationSummary");
      focusFirstError(invalid);
      return;
    }
    if (
      !consent ||
      consentError ||
      catalogError ||
      !procedures.length ||
      !locationsAvailable
    ) {
      announce("dependenciesUnavailable");
      return;
    }
    if (!captchaReady) {
      announce("captchaUnavailable");
      return;
    }

    submitting.current = true;
    setCaptchaPending(true);
    setStatus("submitting");

    let token: string;
    try {
      token = captchaBypass
        ? `local-${Array.from(crypto.getRandomValues(new Uint32Array(4)), (part) => part.toString(16).padStart(8, "0")).join("")}`
        : await freshCaptchaToken(config.captcha.siteKey, config.captcha.action);
    } catch {
      announce("captchaUnavailable");
      submitting.current = false;
      setCaptchaPending(false);
      return;
    } finally {
      setCaptchaPending(false);
    }

    try {
      const submitValues =
        telephoneMethod && dialCountry?.dialRegion
          ? {
              ...values,
              phone:
                normalizeContactPhone(values.phone, dialCountry.dialRegion) ??
                values.phone,
            }
          : values;
      await submitMutation.mutateAsync({
        values: submitValues,
        consent,
        locale,
        token,
      });
      setValues(emptyValues);
      setDrafts(emptyDrafts);
      setAccepted(false);
      setErrors({});
      setStatus("");
      setSuccessToast((previous) => previous + 1);
    } catch (error) {
      if (isAbortError(error)) return;
      if (
        error instanceof ContactApiError &&
        error.code === "CONSENT_REQUIRED"
      ) {
        setAccepted(false);
        void retryConsent();
        setErrors({ consent_accepted: "requiredConsent" });
        announce("consentChanged");
      } else if (error instanceof ContactApiError && error.status === 403) {
        announce("challenge");
      } else if (error instanceof ContactApiError && error.status === 429) {
        announce("throttled");
      } else if (
        error instanceof ContactApiError &&
        error.code === "VALIDATION"
      ) {
        const serverErrors: ContactErrors = {};
        for (const field of error.fields) {
          if (field in emptyValues)
            serverErrors[field as keyof ContactValues] = "serverField";
        }
        setErrors(serverErrors);
        if (Object.keys(serverErrors).length) {
          announce("validationSummary");
          focusFirstError(serverErrors);
        } else {
          announce("submitUnavailable");
        }
      } else {
        announce("submitUnavailable");
      }
    } finally {
      submitting.current = false;
    }
  }

  return { procedures, catalogError, consent, consentError, consentRefreshing, submitMutation, values, accepted, errors, setErrors, status, successToast, captchaPending, captchaState, setCaptchaState, captchaAttempt, setCaptchaAttempt, summary, captchaConfigured, captchaBypass, captchaReady, locationsAvailable, telephoneDraft, dialCountries, dialCountry, busy, success, setAccepted, change, changeMethod, changeEmail, changePhone, changeDialCountry, retryDependencies, submit };
}
