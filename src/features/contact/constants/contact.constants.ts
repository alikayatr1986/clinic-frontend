import { isSupportedCountry } from 'libphonenumber-js';
import { getCountries } from 'libphonenumber-js';
import englishLabels from 'react-phone-number-input/locale/en.json';
import arabicLabels from 'react-phone-number-input/locale/ar.json';
import type { CountryCode } from 'libphonenumber-js';
import type { ContactConfig, ContactCountry, LocationOption } from '@/features/contact/types/contact.types';

const code = /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/;
const text = (value: unknown, max = 200): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value);
function option(value: unknown): value is LocationOption {
  if (!value || typeof value !== 'object') return false;
  const v = value as LocationOption;
  return typeof v.code === 'string' && code.test(v.code) && text(v.en) && text(v.ar);
}
function country(value: unknown): value is ContactCountry {
  if (!option(value)) return false;
  const dialRegion: unknown = (value as ContactCountry).dialRegion;
  return dialRegion === undefined || (typeof dialRegion === 'string' && isSupportedCountry(dialRegion as CountryCode));
}
function locations(raw?: string): ContactCountry[] {
  try {
    if (raw === undefined) {
      const phoneRegions = getCountries();
      const enLabels = englishLabels as unknown as Record<string, string>;
      const arLabels = arabicLabels as unknown as Record<string, string>;
      const extraRegions = ['AQ', 'BV', 'GS', 'HM', 'PN', 'TF', 'UM'] as const;
      return [...phoneRegions.map((region) => ({ code: region.toLowerCase(), en: englishLabels[region] || region, ar: arabicLabels[region] || englishLabels[region] || region, dialRegion: region })),
        ...extraRegions.map((region) => ({ code: region.toLowerCase(), en: enLabels[region], ar: arLabels[region] || enLabels[region] }))];
    }
    if (raw.length > 100000) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data) || data.length > 250 || !data.every(country)) return [];
    if (new Set(data.map((country) => country.code)).size !== data.length) return [];
    return data.map(({ code, en, ar, dialRegion }) => ({ code, en, ar, ...(dialRegion ? { dialRegion } : {}) }));
  } catch { return []; }
}
function channel(raw: string | undefined, host: string, path: RegExp): string | undefined {
  try {
    const url = new URL(raw || '');
    if (url.protocol !== 'https:' || url.hostname !== host || url.port || url.username || url.password || url.search || url.hash || !path.test(url.pathname)) return undefined;
    return url.href;
  } catch { return undefined; }
}
// Called only by the server composition; serialize this allowlist, never process.env.
export function getContactConfig(env: Record<string, string | undefined>): ContactConfig {
  const email = env.CONTACT_PUBLIC_EMAIL?.trim();
  const phone = env.CONTACT_PUBLIC_PHONE?.trim();
  const en = env.CONTACT_ADDRESS_EN?.trim();
  const ar = env.CONTACT_ADDRESS_AR?.trim();
  const siteKey = env.CONTACT_CAPTCHA_SITE_KEY?.trim() || '';
  const action = env.CONTACT_CAPTCHA_ACTION?.trim() || '';
  return {
    countries: locations(env.CONTACT_LOCATIONS_JSON),
    address: text(en, 500) && text(ar, 500) ? { en, ar } : undefined,
    email: email && email.length <= 254 && /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email) ? email : undefined,
    phone: phone && /^\+[1-9]\d{7,14}$/.test(phone) ? phone : undefined,
    whatsapp: channel(env.CONTACT_WHATSAPP_URL, 'wa.me', /^\/[1-9]\d{7,14}\/?$/),
    telegram: channel(env.CONTACT_TELEGRAM_URL, 't.me', /^\/[A-Za-z][A-Za-z0-9_]{4,31}\/?$/),
    captcha: { siteKey: /^[A-Za-z0-9_-]{10,200}$/.test(siteKey) ? siteKey : '', action: /^[A-Za-z0-9/_]{1,100}$/.test(action) ? action : '', devBypass: env.NODE_ENV === 'development' && env.CONTACT_CAPTCHA_DEV_BYPASS === 'true' },
  };
}

// Dialing countries are independent of the reviewed residence configuration.
export function getDialCountries(countries: ContactCountry[]): ContactCountry[] {
  const configuredRegions = new Set(countries.map((item) => item.dialRegion));
  const configuredCodes = new Set(countries.map((item) => item.code));
  return [...countries, ...getCountries().filter((region) => !configuredRegions.has(region)).map((region) => {
    let code = `dial-${region}`;
    while (configuredCodes.has(code)) code = `dial-${code}`;
    return { code, en: englishLabels[region] || region, ar: arabicLabels[region] || englishLabels[region] || region, dialRegion: region };
  })];
}
