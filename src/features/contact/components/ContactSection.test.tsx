import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import enMessages from '../../../../messages/en.json';
import arMessages from '../../../../messages/ar.json';
import { axePass, themedRender } from '@/test/utils';
import { ContactSection } from './ContactSection';
import { ContactApiError, fetchConsent, submitContact } from '@/features/contact/services/contact.service';
import { freshCaptchaToken } from '@/features/contact/services/captcha.service';
import type { ContactConfig } from '@/features/contact/types/contact.types';

vi.mock('@/features/contact/services/contact.service', async (original) => ({ ...await original<typeof import('@/features/contact/services/contact.service')>(), fetchConsent: vi.fn(), submitContact: vi.fn() }));
vi.mock('@/features/contact/services/captcha.service', () => ({ freshCaptchaToken: vi.fn() }));
vi.mock('@/features/procedures/hooks/useProcedures', () => ({ useProcedures: () => ({ procedures: [{ code: 'rhinoplasty', en: 'Rhinoplasty', ar: 'تجميل الأنف' }], error: false, retry: vi.fn() }) }));
const script = vi.hoisted(() => ({ outcome: 'ready' as 'ready' | 'error' | 'stall' }));
vi.mock('next/script', async () => {
  const { useEffect, useRef } = await import('react');
  return { default: function Script(callbacks: { onReady: () => void; onError: () => void }) {
    const initial = useRef(callbacks);
    // Match Next Script: loading starts once per mount, not when callbacks change.
    useEffect(() => {
      if (script.outcome === 'ready') initial.current.onReady();
      if (script.outcome === 'error') initial.current.onError();
    }, []);
    return null;
  } };
});

const config: ContactConfig = {
  countries: [{ code: 'test-country', en: 'Test country', ar: 'بلد تجريبي', cities: [{ code: 'test-city', en: 'Test city', ar: 'مدينة تجريبية' }] }],
  captcha: { siteKey: 'test-public-key', action: 'lead' }, whatsapp: 'https://wa.me/12345678901', telegram: 'https://t.me/testclinic',
};
async function ready() { await screen.findByText('Current consent'); }
async function fill() {
  await ready();
  fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Test person' } });
  fireEvent.change(screen.getByLabelText(/^Country/), { target: { value: 'test-country' } });
  fireEvent.change(screen.getByLabelText(/^City/), { target: { value: 'test-city' } });
  fireEvent.change(screen.getByLabelText(/Interested procedure/), { target: { value: 'rhinoplasty' } });
  fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: 'person@example.test' } });
  fireEvent.change(screen.getByLabelText(/International phone number/), { target: { value: '+1 234 567 8901' } });
  fireEvent.click(screen.getByRole('checkbox'));
}
beforeEach(() => {
  vi.clearAllMocks();
  script.outcome = 'ready';
  vi.mocked(fetchConsent).mockResolvedValue({ version: 'v1', text: 'Current consent' });
  vi.mocked(submitContact).mockResolvedValue('opaque-id');
  vi.mocked(freshCaptchaToken).mockResolvedValue('fresh-token');
});

afterEach(() => vi.useRealTimers());

describe('ContactSection', () => {
  it.each(['error', 'stall'] as const)('recovers a CAPTCHA script %s by remounting while the form stays mounted', async (outcome) => {
    vi.useFakeTimers();
    script.outcome = outcome;
    const { unmount } = themedRender(<ContactSection config={config} />);
    await act(async () => { await Promise.resolve(); });
    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Kept on retry' } });
    if (outcome === 'stall') await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
    script.outcome = 'ready';
    fireEvent.click(screen.getByRole('button', { name: 'Retry verification' }));
    expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled();
    expect(screen.getByLabelText(/Full name/)).toHaveValue('Kept on retry');
    expect(screen.queryByText(/Verification is unavailable/)).not.toBeInTheDocument();
    unmount();
  });
  it('associates server email/phone validation with controls and the focused summary', async () => {
    vi.mocked(submitContact).mockRejectedValueOnce(new ContactApiError(422, 'VALIDATION', ['email', 'phone']));
    themedRender(<ContactSection config={config} />); await fill();
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(screen.getByLabelText(/Email address/)).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.getByLabelText(/Email address/)).toHaveAttribute('aria-describedby', 'contact-email-error');
    expect(screen.getByLabelText(/International phone number/)).toHaveAttribute('aria-describedby', 'contact-phone-help contact-phone-error');
    expect(screen.getByRole('alert')).toHaveFocus();
    expect(screen.getByRole('link', { name: /Email address: Check this field/ })).toHaveAttribute('href', '#contact-email');
    expect(screen.getByRole('link', { name: /International phone number: Check this field/ })).toHaveAttribute('href', '#contact-phone');
    expect(screen.getByLabelText(/Email address/)).toHaveValue('person@example.test');
  });
  it('uses Email by default with named native controls and accessible EN/AR themes', async () => {
    const { container, unmount } = themedRender(<ContactSection config={config} />);
    await ready();
    expect(screen.getByRole('radio', { name: 'Email' })).toBeChecked();
    expect(screen.getByLabelText(/Email address/)).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByLabelText(/International phone number/)).toHaveAttribute('autocomplete', 'tel');
    await axePass(container);
    unmount();
    const ar = themedRender(<ContactSection config={config} />, { locale: 'ar', dir: 'rtl', theme: 'dark' });
    await ready();
    expect(screen.getByRole('radio', { name: 'البريد الإلكتروني' })).toBeChecked();
    await axePass(ar.container);
  });
  it.each(['Email', 'WhatsApp', 'Telegram'])('preserves values and sends both contacts for %s', async (method) => {
    themedRender(<ContactSection config={config} />); await fill();
    await userEvent.click(screen.getByRole('radio', { name: method }));
    expect(screen.getByLabelText(/Email address/)).toHaveValue('person@example.test');
    expect(screen.getByLabelText(/International phone number/)).toHaveValue('+1 234 567 8901');
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await screen.findByText('Your contact request has been received.');
    expect(submitContact).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'person@example.test',
        phone: '+1 234 567 8901',
        city: 'test-city',
        country: 'test-country',
        preferred_contact: method.toLowerCase(),
      }),
      expect.objectContaining({ version: 'v1' }),
      'en',
      'fresh-token',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
  it('resets form fields and consent checkbox on successful submission', async () => {
    themedRender(<ContactSection config={config} />);
    await fill();
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await screen.findByText('Your contact request has been received.');
    expect(screen.getByLabelText(/Full name/)).toHaveValue('');
    expect(screen.getByLabelText(/Email address/)).toHaveValue('');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
  it('rejects invalid fields locally, associates errors and focuses the summary', async () => {
    themedRender(<ContactSection config={config} />); await ready();
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(submitContact).not.toHaveBeenCalled(); expect(freshCaptchaToken).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveFocus();
    expect(screen.getByLabelText(/Email address/)).toHaveAttribute('aria-describedby', 'contact-email-error');
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
  });
  it.each([403, 429, 503])('keeps values and obtains a fresh token on retry after %s', async (status) => {
    vi.mocked(submitContact).mockRejectedValueOnce(new ContactApiError(status, 'FAILED'));
    vi.mocked(freshCaptchaToken).mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    themedRender(<ContactSection config={config} />); await fill();
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled());
    if (status === 403) {
      expect(screen.getByText(enMessages.contact.challenge)).toBeInTheDocument();
    } else if (status === 429) {
      expect(screen.getByText(enMessages.contact.throttled)).toBeInTheDocument();
    } else {
      expect(screen.getByText(enMessages.contact.submitUnavailable)).toBeInTheDocument();
    }
    expect(screen.getByLabelText(/Full name/)).toHaveValue('Test person');
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await screen.findByText('Your contact request has been received.');
    expect(freshCaptchaToken).toHaveBeenCalledTimes(2);
    expect(vi.mocked(submitContact).mock.calls[1][3]).toBe('second');
  });
  it('resets accepted consent when locale changes', async () => {
    const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    function Harness({ locale }: { locale: 'en' | 'ar' }) {
      return (
        <NextIntlClientProvider locale={locale} messages={locale === 'ar' ? arMessages : enMessages}>
          <QueryClientProvider client={testQueryClient}>
            <ContactSection config={config} />
          </QueryClientProvider>
        </NextIntlClientProvider>
      );
    }
    const { rerender } = render(<Harness locale="en" />);
    await ready();
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    rerender(<Harness locale="ar" />);
    await ready();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
  it('silently ignores aborted submission without announcing error', async () => {
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    vi.mocked(submitContact).mockRejectedValueOnce(abortError);
    themedRender(<ContactSection config={config} />);
    await fill();
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(submitContact).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(enMessages.contact.submitUnavailable)).not.toBeInTheDocument();
  });
  it('refreshes changed consent and requires reacceptance while preserving contacts', async () => {
    vi.mocked(submitContact).mockRejectedValueOnce(new ContactApiError(422, 'CONSENT_REQUIRED'));
    themedRender(<ContactSection config={config} />); await fill();
    vi.mocked(fetchConsent).mockResolvedValue({ version: 'v2', text: 'Updated consent' });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await screen.findByText('Updated consent'); expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByLabelText(/Email address/)).toHaveValue('person@example.test');
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(submitContact).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await screen.findByText('Your contact request has been received.');
    expect(vi.mocked(submitContact).mock.calls[1][1].version).toBe('v2');
  });
  it('blocks duplicate clicks while CAPTCHA or the API is pending', async () => {
    let resolve!: (value: string) => void;
    vi.mocked(freshCaptchaToken).mockReturnValue(new Promise((done) => { resolve = done; }));
    themedRender(<ContactSection config={config} />); await fill();
    const form = screen.getByRole('form'); fireEvent.submit(form); fireEvent.submit(form);
    expect(freshCaptchaToken).toHaveBeenCalledTimes(1);
    resolve('fresh'); await screen.findByText('Your contact request has been received.');
    expect(submitContact).toHaveBeenCalledTimes(1);
  });
  it('preserves values on CAPTCHA outage and prevents API submission', async () => {
    vi.mocked(freshCaptchaToken).mockRejectedValue(new Error('offline'));
    themedRender(<ContactSection config={config} />); await fill(); fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await screen.findByText(/Verification is unavailable/); expect(submitContact).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Full name/)).toHaveValue('Test person');
  });
  it('retries dependency failures without losing entered values', async () => {
    vi.mocked(fetchConsent).mockRejectedValueOnce(new Error('offline'));
    themedRender(<ContactSection config={config} />);
    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Kept' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Retry loading' })); await ready();
    expect(screen.getByLabelText(/Full name/)).toHaveValue('Kept');
  });
  it('fails closed for missing location/CAPTCHA config and hides unconfigured public details', async () => {
    themedRender(<ContactSection config={{ countries: [], captcha: { siteKey: '', action: '' } }} />); await ready();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
    expect(screen.getByText(/Country and city selections/)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
  it('direct channels are external navigation and do not submit a lead', async () => {
    themedRender(<ContactSection config={config} />); await ready();
    const link = screen.getByRole('link', { name: /Chat on WhatsApp/ });
    expect(link).toHaveAttribute('href', config.whatsapp); expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(submitContact).not.toHaveBeenCalled();
  });
});
