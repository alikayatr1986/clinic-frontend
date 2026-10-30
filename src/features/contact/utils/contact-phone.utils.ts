import { parsePhoneNumberFromString } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

export function normalizeContactPhone(raw: string, region: CountryCode): string | null {
  if (!raw.trim() || raw.length > 64) return null;
  const value = raw.trim();
  const parsed = parsePhoneNumberFromString(
    value,
    value.startsWith('+') ? { extract: false } : { defaultCountry: region, extract: false },
  );
  return parsed?.isValid() && !parsed.ext ? parsed.number : null;
}
