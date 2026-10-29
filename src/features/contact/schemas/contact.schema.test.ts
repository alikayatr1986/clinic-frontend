import { describe, expect, it } from 'vitest';
import { validateContact } from './contact.schema';
import type { ContactValues } from '@/features/contact/types/contact.types';
const countries = [{ code: 'country-a', en: 'A', ar: 'أ', cities: [{ code: 'city-a', en: 'City A', ar: 'مدينة أ' }] }, { code: 'country-b', en: 'B', ar: 'ب', cities: [{ code: 'city-b', en: 'City B', ar: 'مدينة ب' }] }];
const procedures = [{ code: 'rhinoplasty', en: 'Rhinoplasty', ar: 'تجميل الأنف' }];
const valid: ContactValues = { name: 'Test', country: 'country-a', city: 'city-a', procedure: 'rhinoplasty', email: 'test@example.test', phone: '+12345678901', preferred_contact: 'email', message: '' };
describe('contact validation', () => {
  it.each(['missing-at.example.test', 'test@', 'test@ example.test', 'test@example.test other'])('rejects malformed nonempty email %s', (email) => {
    expect(validateContact({ ...valid, email }, true, countries, procedures)).toEqual({ email: 'invalidEmail' });
  });
  it.each(['12345678901', '+01234567890', '+123', '+1234567890123456', '+1234567letters'])('rejects malformed nonempty phone %s', (phone) => {
    expect(validateContact({ ...valid, phone }, true, countries, procedures)).toEqual({ phone: 'invalidPhone' });
  });
  it('rejects a city from another configured country', () => {
    expect(validateContact({ ...valid, city: 'city-b' }, true, countries, procedures)).toEqual({ city: 'requiredCity' });
  });
  it('rejects unknown nonempty location codes', () => {
    expect(validateContact({ ...valid, country: 'unknown', city: 'unknown' }, true, countries, procedures)).toEqual({ country: 'requiredCountry', city: 'requiredCity' });
  });
  it('accepts complete values with international phone formatting', () => {
    expect(validateContact({ ...valid, phone: '+1 (234) 567-8901' }, true, countries, procedures)).toEqual({});
  });
});
