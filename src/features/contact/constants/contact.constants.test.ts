import { describe, expect, it } from 'vitest';
import { getDialCountries, getContactConfig } from './contact.constants';
const country = { code: 'test', en: 'Test', ar: 'اختبار', dialRegion: 'TR' };
describe('public contact config allowlist', () => {
  it('exposes only validated reviewed public props', () => {
    const config = getContactConfig({ CONTACT_LOCATIONS_JSON: JSON.stringify([{ ...country, secret: 'hidden' }]), CONTACT_PUBLIC_EMAIL: 'public@example.test', CONTACT_PUBLIC_PHONE: '+12345678901', CONTACT_WHATSAPP_URL: 'https://wa.me/12345678901', CONTACT_TELEGRAM_URL: 'https://t.me/testclinic', CONTACT_ADDRESS_EN: 'Reviewed address', CONTACT_ADDRESS_AR: 'عنوان معتمد', CONTACT_CAPTCHA_SITE_KEY: 'test-public-key', CONTACT_CAPTCHA_ACTION: 'lead', DATABASE_PASSWORD: 'never-public' });
    expect(config.countries).toEqual([country]); expect(config.email).toBe('public@example.test');
    expect(JSON.stringify(config)).not.toContain('hidden'); expect(JSON.stringify(config)).not.toContain('never-public');
  });
  it.each(['invalid', '{}', JSON.stringify([{ ...country, code: '<bad>' }]), JSON.stringify([country, country]), JSON.stringify([{ ...country, dialRegion: 'ZZ' }]), JSON.stringify([{ ...country, ar: '' }])])('fails closed for malformed location mapping %s', (raw) => {
    expect(getContactConfig({ CONTACT_LOCATIONS_JSON: raw }).countries).toEqual([]);
  });
  it.each(['javascript:alert(1)', 'https://evil.test/12345678901', 'https://wa.me@evil.test/12345678901', 'https://user:pass@wa.me/12345678901', 'https://wa.me/12345678901?text=private'])('rejects unsafe channel %s', (raw) => {
    expect(getContactConfig({ CONTACT_WHATSAPP_URL: raw }).whatsapp).toBeUndefined();
  });
  it('hides invalid details and fails CAPTCHA configuration closed', () => {
    expect(getContactConfig({ CONTACT_PUBLIC_EMAIL: 'x@example.test\nBcc: bad', CONTACT_PUBLIC_PHONE: '123', CONTACT_CAPTCHA_SITE_KEY: '<bad>', CONTACT_CAPTCHA_ACTION: 'lead?x' })).toMatchObject({ email: undefined, phone: undefined, captcha: { siteKey: '', action: '' } });
  });
});

it('retains dialing regions when configured codes collide and provides Arabic labels', () => {
  const countries = getDialCountries([{ code: 'dial-GB', en: 'Other', ar: 'آخر' }]);
  expect(countries.find (item => item.dialRegion === 'GB')).toMatchObject({ code: 'dial-dial-GB', en: 'United Kingdom' });
  expect(countries.find (item => item.dialRegion === 'GB')?.ar).not.toBe('United Kingdom');
});

it('provides localized countries by default and honors an explicit empty list', () => {
  const config = getContactConfig({});
  expect(config.countries.find((item) => item.code === 'tr')).toMatchObject({ en: 'Turkey', dialRegion: 'TR' });
  expect(config.countries.find((item) => item.code === 'tr')?.ar).not.toBe('Turkey');
  expect(config.countries.find((item) => item.code === 'gb')).toMatchObject({ en: 'United Kingdom', dialRegion: 'GB' });
  expect(config.countries.find((item) => item.code === 'aq')).toMatchObject({ en: 'Antarctica' });
  expect(getContactConfig({ CONTACT_LOCATIONS_JSON: '' }).countries).toEqual([]);
  expect(getContactConfig({ CONTACT_LOCATIONS_JSON: '[]' }).countries).toEqual([]);
});

it('enables the bypass only with explicit development configuration', () => {
  expect(getContactConfig({ NODE_ENV: 'development', CONTACT_CAPTCHA_DEV_BYPASS: 'true' }).captcha.devBypass).toBe(true);
  for (const NODE_ENV of ['production', 'test', undefined]) {
    expect(getContactConfig({ NODE_ENV, CONTACT_CAPTCHA_DEV_BYPASS: 'true' }).captcha.devBypass).toBe(false);
  }
  expect(getContactConfig({ NODE_ENV: 'development' }).captcha.devBypass).toBe(false);
});
