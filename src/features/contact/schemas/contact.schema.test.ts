import { describe, expect, it } from 'vitest';
import { validateContact } from './contact.schema';
import type { ContactValues } from '@/features/contact/types/contact.types';

const countries = [
  { code: 'tr', en: 'Türkiye', ar: 'تركيا', dialRegion: 'TR' as const },
  { code: 'us', en: 'United States', ar: 'الولايات المتحدة', dialRegion: 'US' as const },
  { code: 'unmapped', en: 'Unmapped', ar: 'غير متاح' },
];
const procedures = [{ code: 'rhinoplasty', en: 'Rhinoplasty', ar: 'تجميل الأنف' }];
const valid: ContactValues = { name: 'Test', country: 'tr', procedure: 'rhinoplasty', email: 'test@example.test', phone: '', preferred_contact: 'email', message: '' };

describe('contact validation', () => {
  it('accepts the country-only default email journey', () => {
    expect(validateContact(valid, true, countries, procedures)).toEqual({});
  });
  it.each(['phone_call', 'whatsapp', 'telegram'] as const)('accepts a national phone for %s using reviewed metadata', (preferred_contact) => {
    expect(validateContact({ ...valid, preferred_contact, email: '', phone: '0532 123 45 67' }, true, countries, procedures, 'tr')).toEqual({});
  });
  it('parses a pasted international number directly', () => {
    expect(validateContact({ ...valid, preferred_contact: 'whatsapp', email: '', phone: '+1 415 555 2671' }, true, countries, procedures, 'tr')).toEqual({});
  });
  it('rejects invalid active values and missing dial metadata', () => {
    expect(validateContact({ ...valid, email: 'bad' }, true, countries, procedures)).toMatchObject({ email: 'invalidEmail' });
    expect(validateContact({ ...valid, preferred_contact: 'telegram', email: '', phone: '123' }, true, countries, procedures, 'unmapped')).toMatchObject({ dial_country: 'dialUnavailable' });
  });
  it.each(['+90 532 123 45 67 ext. 123', '0532 123 45 67 x123'])('rejects phone extensions instead of silently stripping them: %s', (phone) => {
    expect(validateContact({ ...valid, preferred_contact: 'phone_call', email: '', phone }, true, countries, procedures, 'tr')).toMatchObject({ phone: 'invalidPhone' });
  });
  it.each(['Call me at +90 532 123 45 67', 'My number is 0532 123 45 67'])('rejects a phone number embedded in surrounding prose: %s', (phone) => {
    expect(validateContact({ ...valid, preferred_contact: 'phone_call', email: '', phone }, true, countries, procedures, 'tr')).toMatchObject({ phone: 'invalidPhone' });
  });
});
