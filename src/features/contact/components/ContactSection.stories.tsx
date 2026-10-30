import { useLayoutEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { NextIntlClientProvider } from 'next-intl';
import { expect, userEvent, within } from 'storybook/test';
import { ContactSection } from './ContactSection';
import type { ContactConfig, ContactStoryFixturesProps } from '@/features/contact/types/contact.types';
import en from '../../../../messages/en.json';
import ar from '../../../../messages/ar.json';

const config: ContactConfig = {
  countries: [
    { code: 'tr', en: 'Türkiye (fixture)', ar: 'تركيا', dialRegion: 'TR' },
    { code: 'us', en: 'United States (fixture)', ar: 'الولايات المتحدة', dialRegion: 'US' },
    { code: 'unmapped', en: 'Unmapped country (fixture)', ar: 'بلد بلا بيانات' },
  ],
  address: { en: 'Reviewed address (fixture)', ar: 'عنوان تجريبي' }, email: 'clinic@example.test', phone: '+12345678901',
  whatsapp: 'https://wa.me/12345678901', telegram: 'https://t.me/testclinic', captcha: { siteKey: '', action: '' },
};
function Fixtures({ children }: ContactStoryFixturesProps) {
  useLayoutEffect(() => {
    const original = window.fetch;
    window.fetch = async (input, init) => {
      if (String(input).startsWith('/api/v1/consent')) return Response.json({ version: 'fixture-v1', text: String(input).includes('ar') ? 'نص موافقة تجريبي للعرض فقط.' : 'Demonstration consent text for preview only.' });
      if (String(input) === '/api/v1/procedures') return Response.json({ data: [{ code: 'fixture-procedure', en: 'Example procedure (fixture)', ar: 'إجراء تجريبي' }] });
      return original(input, init);
    };
    return () => { window.fetch = original; };
  }, []);
  return children;
}
const meta = {
  title: 'Site/ContactSection', component: ContactSection, args: { config }, parameters: { layout: 'fullscreen' },
  decorators: [(Story, context) => {
    const locale = context.globals.locale === 'ar' ? 'ar' : 'en';
    return <Fixtures><NextIntlClientProvider locale={locale} messages={locale === 'ar' ? ar : en}><Story /></NextIntlClientProvider></Fixtures>;
  }],
} satisfies Meta<typeof ContactSection>;
export default meta;
export const English: StoryObj<typeof meta> = { parameters: { chromatic: { viewports: [320, 390, 430, 768, 1024, 1440] } } };
export const Arabic: StoryObj<typeof meta> = { globals: { locale: 'ar' }, parameters: { chromatic: { viewports: [320, 390, 430, 768, 1024, 1440] } } };
export const DarkArabic: StoryObj<typeof meta> = { ...Arabic, decorators: [(Story) => <div className="dark"><Story /></div>] };
export const Zoom200: StoryObj<typeof meta> = { decorators: [(Story) => <div style={{ zoom: 2 }}><Story /></div>], parameters: { chromatic: { viewports: [320] } } };
export const WhatsApp: StoryObj<typeof meta> = { play: async ({ canvasElement }) => {
  const canvas = within(canvasElement); await userEvent.click(canvas.getByRole('radio', { name: 'WhatsApp' })); await expect(canvas.getByRole('radio', { name: 'WhatsApp' })).toBeChecked();
} };
export const Telegram: StoryObj<typeof meta> = { play: async ({ canvasElement }) => {
  const canvas = within(canvasElement); await userEvent.click(canvas.getByRole('radio', { name: 'Telegram' })); await expect(canvas.getByRole('radio', { name: 'Telegram' })).toBeChecked();
} };
export const PhoneCall: StoryObj<typeof meta> = { play: async ({ canvasElement }) => {
  const canvas = within(canvasElement); await userEvent.click(canvas.getByRole('radio', { name: 'Phone call' })); await expect(canvas.getByRole('radio', { name: 'Phone call' })).toBeChecked();
} };
export const MissingConfiguration: StoryObj<typeof meta> = { args: { config: { countries: [], captcha: { siteKey: '', action: '' } } } };
