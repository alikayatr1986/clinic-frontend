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
  const cities: unknown = (value as ContactCountry).cities;
  return Array.isArray(cities) && cities.length > 0 && cities.length <= 1000 && cities.every(option) && new Set(cities.map((city) => city.code)).size === cities.length;
}
function locations(raw?: string): ContactCountry[] {
  try {
    if (!raw || raw.length > 100000) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data) || data.length > 250 || !data.every(country)) return [];
    if (new Set(data.map((country) => country.code)).size !== data.length) return [];
    return data.map(({ code, en, ar, cities }) => ({ code, en, ar, cities: cities.map(({ code, en, ar }: LocationOption) => ({ code, en, ar })) }));
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
    captcha: { siteKey: /^[A-Za-z0-9_-]{10,200}$/.test(siteKey) ? siteKey : '', action: /^[A-Za-z0-9/_]{1,100}$/.test(action) ? action : '' },
  };
}
