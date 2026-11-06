import type { CountryCode } from 'libphonenumber-js';
import type { ReactNode } from 'react';

export interface LocationOption { code: string; en: string; ar: string }
export interface ContactCountry extends LocationOption { dialRegion?: CountryCode }
export interface ContactConfig {
  countries: ContactCountry[];
  address?: { en: string; ar: string };
  email?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  captcha: { siteKey: string; action: string; devBypass?: boolean };
}
export interface Consent { version: string; text: string }
export type ContactMethod = 'email' | 'phone_call' | 'whatsapp' | 'telegram';
export type TelephoneMethod = Exclude<ContactMethod, 'email'>;
export interface ContactValues {
  name: string; country: string; procedure: string;
  email: string; phone: string; preferred_contact: ContactMethod; message: string;
}
export interface TelephoneDraft { number: string; dialCountry: string }
export interface ContactDrafts { email: string; phone_call: TelephoneDraft; whatsapp: TelephoneDraft; telegram: TelephoneDraft }
export type ContactCopyKey = Exclude<keyof typeof import('../../../../messages/en.json')['contact'], 'methods' | 'direct'>;
export type ContactErrorField = keyof ContactValues | 'consent_accepted' | 'dial_country';
export type ContactErrors = Partial<Record<ContactErrorField, ContactCopyKey>>;

export interface ContactSectionProps {
  config: ContactConfig;
}
export interface ContactStoryFixturesProps { children: ReactNode }

export interface FetchConsentOptions { signal?: AbortSignal }
export interface SubmitContactOptions { signal?: AbortSignal; proof?: string; flow?: string }
export interface SubmitContactArgs { values: ContactValues; consent: Consent; locale: string; token: string; signal?: AbortSignal; proof?: string; flow?: string }

export interface ContactPhoneInputProps {
  id?: string;
  name?: string;
  value: string;
  country?: CountryCode;
  defaultCountry?: CountryCode;
  countries: ContactCountry[];
  selectedDialCountry?: string;
  disabled?: boolean;
  required?: boolean;
  hasError?: boolean;
  locale: string;
  selectCountryLabel?: string;
  countryAriaLabel?: string;
  inputAriaLabel?: string;
  ariaDescribedBy?: string;
  onChange: (value: string) => void;
  onCountryChange: (countryCode: string) => void;
}



export interface ContactFormBoundaryProps { config: ContactConfig; locale: "en" | "ar" }

export interface ContactFormProps {
  config: ContactConfig;
  locale: "en" | "ar";
  form: ReturnType<typeof import("@/features/contact/hooks/useContactForm").useContactForm>;
}
export interface ContactInformationProps { config: ContactConfig; locale: "en" | "ar" }

export type VerificationPolicy = Record<ContactMethod, boolean> & { whatsapp_sms_fallback?: boolean };
export interface VerificationRequest {
  method: ContactMethod;
  destination: string;
  recaptcha_token: string;
  challenge?: string;
  flow?: string;
  code?: string;
  sms_consent?: boolean;
}
export interface VerificationResponse { challenge?: string; flow?: string; proof?: string }

export interface VerificationMutationArgs { operation: 'issue' | 'resend' | 'check' | 'fallback' | 'undelivered'; input: VerificationRequest; signal?: AbortSignal }
