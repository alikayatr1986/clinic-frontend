export interface LocationOption { code: string; en: string; ar: string }
export interface ContactCountry extends LocationOption { cities: LocationOption[] }
export interface ContactConfig {
  countries: ContactCountry[];
  address?: { en: string; ar: string };
  email?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  captcha: { siteKey: string; action: string };
}
export interface Consent { version: string; text: string }
export interface ContactValues {
  name: string; country: string; city: string; procedure: string;
  email: string; phone: string; preferred_contact: 'email' | 'whatsapp' | 'telegram'; message: string;
}
export type ContactCopyKey = Exclude<keyof typeof import('../../../../messages/en.json')['contact'], 'methods' | 'direct'>;
export type ContactErrors = Partial<Record<keyof ContactValues | 'consent_accepted', ContactCopyKey>>;
