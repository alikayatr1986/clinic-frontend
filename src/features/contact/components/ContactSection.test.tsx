import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axePass, themedRender } from '@/test/utils';
import { ContactSection } from './ContactSection';
import { getContactConfig } from '@/features/contact/constants/contact.constants';
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
    useEffect(() => {
      if (script.outcome === 'ready') initial.current.onReady();
      if (script.outcome === 'error') initial.current.onError();
    }, []);
    return null;
  } };
});

const config: ContactConfig = {
  countries: [
    { code: 'tr', en: 'Türkiye', ar: 'تركيا', dialRegion: 'TR' },
    { code: 'us', en: 'United States', ar: 'الولايات المتحدة', dialRegion: 'US' },
    { code: 'unmapped', en: 'Unmapped', ar: 'غير متاح' },
  ],
  captcha: { siteKey: 'test-public-key', action: 'lead' },
};

async function ready() { await screen.findByRole('button', { name: 'Read consent text' }); }
async function fillBase() {
  await ready();
  fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Test person' } });
  fireEvent.change(screen.getByLabelText(/^Country/), { target: { value: 'tr' } });
  fireEvent.change(screen.getByLabelText(/Interested procedure/), { target: { value: 'rhinoplasty' } });
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
  it('defaults to email with no city or inactive phone control and passes EN/AR accessibility', async () => {
    const view = themedRender(<ContactSection config={config} />);
    await ready();
    expect(screen.getByRole('radio', { name: 'Email' })).toBeChecked();
    expect(screen.getByLabelText(/Email address/)).toBeRequired();
    expect(screen.queryByLabelText(/Phone number/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/City/)).not.toBeInTheDocument();
    await axePass(view.container);
    view.unmount();
    const arabic = themedRender(<ContactSection config={config} />, { locale: 'ar', dir: 'rtl', theme: 'dark' });
    await screen.findByRole('button', { name: 'قراءة نص الموافقة' });
    await axePass(arabic.container);
  });

  it('allows a default residence and submits its stable country code', async () => {
    const defaults = getContactConfig({});
    themedRender(<ContactSection config={{ ...defaults, captcha: config.captcha }} />);
    await fillBase();
    fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: 'person@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    const toast = await screen.findByText('Message sent successfully.');
    expect(toast).toHaveAttribute('role', 'status');
    expect(screen.getByRole('form', { name: 'Contact request' })).not.toContainElement(toast);
    expect(submitContact).toHaveBeenCalledWith(expect.objectContaining({ country: 'tr' }), expect.anything(), 'en', 'fresh-token', expect.anything());
  });

  it('shows validation errors beneath fields without a visible summary', async () => {
    const view = themedRender(<ContactSection config={config} />);
    await ready();
    expect(screen.queryByText(/Fields marked/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    const name = screen.getByLabelText(/Full name/);
    const errorId = name.getAttribute('aria-describedby');
    expect(errorId).toBe('contact-name-error');
    expect(document.getElementById(errorId!)).toBeVisible();
    await waitFor(() => expect(name).toHaveFocus());
    expect(screen.getByText(/Please check the highlighted fields/).closest('[role=alert]')).toHaveAttribute('aria-live', 'polite');
    await axePass(view.container);
  });

  it('focuses server errors in form order and associates them with fields', async () => {
    vi.mocked(submitContact).mockRejectedValueOnce(new ContactApiError(422, 'VALIDATION', ['email', 'name']));
    themedRender(<ContactSection config={config} />);
    await fillBase();
    fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: 'person@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(screen.getByLabelText(/Full name/)).toHaveFocus());
    expect(screen.getByLabelText(/Email address/)).toHaveAccessibleDescription();
  });

  it('opens the current consent in a dialog without changing the checkbox', async () => {
    themedRender(<ContactSection config={config} />);
    await ready();
    const trigger = screen.getByRole('button', { name: 'Read consent text' });
    expect(screen.queryByText('Current consent')).not.toBeInTheDocument();
    await userEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Consent text' })).toHaveTextContent('Current consent');
    await userEvent.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('preserves multiline Arabic consent in the localized dialog', async () => {
    vi.mocked(fetchConsent).mockResolvedValue({ version: 'v1', text: 'السطر الأول\nالسطر الثاني' });
    themedRender(<ContactSection config={config} />, { locale: 'ar', dir: 'rtl' });
    await userEvent.click(await screen.findByRole('button', { name: 'قراءة نص الموافقة' }));
    const dialog = screen.getByRole('dialog', { name: 'نص الموافقة' });
    expect(dialog).toHaveAttribute('dir', 'rtl');
    expect(dialog).toHaveTextContent('السطر الأول السطر الثاني');
    expect(screen.getByText(/السطر الأول/).parentElement).toHaveClass('whitespace-pre-wrap');
  });

  it('submits with fresh local tokens when development bypass is enabled', async () => {
    vi.mocked(submitContact).mockRejectedValueOnce(new ContactApiError(503, 'FAILED'));
    themedRender(<ContactSection config={{ ...config, captcha: getContactConfig({ NODE_ENV: 'development', CONTACT_CAPTCHA_DEV_BYPASS: 'true' }).captcha }} />);
    await fillBase();
    fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: 'person@example.test' } });
    expect(screen.queryByText(/Verification is unavailable/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await screen.findByText('Message sent successfully.');
    const firstToken = vi.mocked(submitContact).mock.calls[0][3];
    const secondToken = vi.mocked(submitContact).mock.calls[1][3];
    expect(firstToken).toMatch(/^local-/);
    expect(secondToken).not.toBe(firstToken);
    expect(freshCaptchaToken).not.toHaveBeenCalled();
  });

  it('supports keyboard selection of the method-specific control', async () => {
    themedRender(<ContactSection config={config} />);
    await ready();
    const email = screen.getByRole('radio', { name: 'Email' });
    email.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Phone call' })).toBeChecked();
    expect(screen.getByLabelText(/Phone number/)).toBeVisible();
    expect(screen.queryByText(/Enter a national number for the selected phone country/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Email address/)).not.toBeInTheDocument();
  });

  it.each([['Phone call', 'phone_call'], ['WhatsApp', 'whatsapp'], ['Telegram', 'telegram']] as const)('normalizes and submits the active phone for %s', async (label, method) => {
    themedRender(<ContactSection config={config} />);
    await fillBase();
    await userEvent.click(screen.getByRole('radio', { name: label }));
    fireEvent.change(screen.getByLabelText(/Phone number/), { target: { value: '0532 123 45 67' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await screen.findByText('Message sent successfully.');
    expect(submitContact).toHaveBeenCalledWith(
      expect.objectContaining({ preferred_contact: method, email: '', phone: '+905321234567', country: 'tr' }),
      expect.objectContaining({ version: 'v1' }), 'en', 'fresh-token', expect.anything(),
    );
  });

  it('offers and submits a phone country outside the residence configuration', async () => {
    themedRender(<ContactSection config={config} />);
    await fillBase();
    await userEvent.click(screen.getByRole('radio', { name: 'Phone call' }));
    const selector = screen.getByLabelText(/Phone country/);
    expect(screen.getByRole('option', { name: /United Kingdom \(\+44\)/ })).toBeInTheDocument();
    fireEvent.change(selector, { target: { value: 'dial-GB' } });
    fireEvent.change(screen.getByLabelText(/Phone number/), { target: { value: '020 7946 0018' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await screen.findByText('Message sent successfully.');
    expect(submitContact).toHaveBeenCalledWith(expect.objectContaining({ country: 'tr', phone: '+442079460018' }), expect.anything(), 'en', 'fresh-token', expect.anything());
  });

  it('preserves per-method drafts and resets dial selection on country change without rewriting digits', async () => {
    themedRender(<ContactSection config={config} />);
    await ready();
    fireEvent.change(screen.getByLabelText(/^Country/), { target: { value: 'tr' } });
    await userEvent.click(screen.getByRole('radio', { name: 'Phone call' }));
    fireEvent.change(screen.getByLabelText(/Phone number/), { target: { value: '0532 111 2233' } });
    await userEvent.click(screen.getByRole('radio', { name: 'WhatsApp' }));
    fireEvent.change(screen.getByLabelText(/Phone number/), { target: { value: '0532 999 8877' } });
    await userEvent.click(screen.getByRole('radio', { name: 'Phone call' }));
    expect(screen.getByLabelText(/Phone number/)).toHaveValue('0532 111 2233');
    fireEvent.change(screen.getByLabelText(/^Country/), { target: { value: 'us' } });
    expect(screen.getByLabelText(/Phone country/)).toHaveValue('us');
    expect(screen.getByLabelText(/Phone number/)).toHaveValue('0532 111 2233');
  });

  it('blocks telephone submission when residence has no reviewed dial metadata', async () => {
    themedRender(<ContactSection config={config} />);
    await fillBase();
    fireEvent.change(screen.getByLabelText(/^Country/), { target: { value: 'unmapped' } });
    await userEvent.click(screen.getByRole('radio', { name: 'Telegram' }));
    fireEvent.change(screen.getByLabelText(/Phone number/), { target: { value: '+905321234567' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect((await screen.findAllByText(/reviewed phone metadata/)).length).toBeGreaterThan(0);
    expect(submitContact).not.toHaveBeenCalled();
  });

  it.each([403, 429, 503])('keeps drafts and obtains a fresh token after %s', async (status) => {
    vi.mocked(submitContact).mockRejectedValueOnce(new ContactApiError(status, 'FAILED'));
    vi.mocked(freshCaptchaToken).mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    themedRender(<ContactSection config={config} />);
    await fillBase();
    fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: 'person@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled());
    expect(screen.getByLabelText(/Email address/)).toHaveValue('person@example.test');
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await screen.findByText('Message sent successfully.');
    expect(freshCaptchaToken).toHaveBeenCalledTimes(2);
  });

  it('disables stale cached consent during a delayed refresh and requires acceptance of the exact replacement', async () => {
    let resolveRefresh!: (consent: { version: string; text: string }) => void;
    vi.mocked(fetchConsent)
      .mockResolvedValueOnce({ version: 'v1', text: 'Current consent' })
      .mockImplementationOnce(() => new Promise((resolve) => { resolveRefresh = resolve; }));
    vi.mocked(submitContact).mockRejectedValueOnce(new ContactApiError(422, 'CONSENT_REQUIRED'));
    themedRender(<ContactSection config={config} />);
    await fillBase();
    fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: 'person@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await screen.findByText(/consent text has changed/);
    expect(screen.getByRole('button', { name: 'Read consent text' })).toBeDisabled();
    expect(screen.getByRole('checkbox')).toBeDisabled();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    await act(async () => { resolveRefresh({ version: 'v2', text: 'Updated consent' }); });
    await waitFor(() => expect(screen.getByRole('checkbox')).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: 'Read consent text' }));
    expect(await screen.findByText('Updated consent')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('checkbox')).toBeEnabled();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it.each(['error', 'stall'] as const)('recovers CAPTCHA %s without losing fields', async (outcome) => {
    vi.useFakeTimers();
    script.outcome = outcome;
    themedRender(<ContactSection config={config} />);
    await act(async () => { await Promise.resolve(); });
    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Kept' } });
    if (outcome === 'stall') await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
    script.outcome = 'ready';
    fireEvent.click(screen.getByRole('button', { name: 'Retry verification' }));
    expect(screen.getByLabelText(/Full name/)).toHaveValue('Kept');
  });

  it('fails closed when country configuration is unavailable', async () => {
    themedRender(<ContactSection config={{ countries: [], captcha: { siteKey: '', action: '' } }} />);
    await ready();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
    expect(screen.getByLabelText(/^Country/)).toHaveAccessibleDescription(/Country selections are not available/);
  });
});
