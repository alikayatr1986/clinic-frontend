import { apiRequest, ApiError, isAbortError } from '@/lib/api';
import type { Consent, ContactValues, FetchConsentOptions, SubmitContactOptions } from '@/features/contact/types/contact.types';

export class ContactApiError extends Error {
  constructor(public status: number, public code: string, public fields: string[] = []) {
    super('Contact request failed');
    this.name = 'ContactApiError';
  }
}

export async function fetchConsent(
  locale: string,
  options: FetchConsentOptions = {},
): Promise<Consent> {
  const lang = locale === 'ar' ? 'ar' : 'en';
  try {
    const body = await apiRequest<{ version?: unknown; text?: unknown }>(
      '/api/v1/consent',
      {
        query: { lang },
        signal: options.signal,
      },
    );
    if (
      !body ||
      typeof body.version !== 'string' ||
      !body.version ||
      typeof body.text !== 'string' ||
      !body.text
    ) {
      throw new Error('Consent unavailable');
    }
    return { version: body.version, text: body.text };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new Error('Consent unavailable', { cause: error });
  }
}

export async function submitContact(
  values: ContactValues,
  consent: Consent,
  locale: string,
  token: string,
  options: SubmitContactOptions = {},
): Promise<string> {
  try {
    const body = await apiRequest<{ data?: { id?: unknown } }>('/api/v1/leads', {
      method: 'POST',
      headers: { 'Accept-Language': locale },
      body: {
        name: values.name.trim(),
        country: values.country,
        procedure: values.procedure,
        preferred_contact: values.preferred_contact,
        ...(values.preferred_contact === 'email'
          ? { email: values.email.trim().toLowerCase() }
          : { phone: values.phone }),
        message: values.message.trim(),
        consent_accepted: true,
        consent_version: consent.version,
        lang: locale,
        recaptcha_token: token,
      },
      signal: options.signal,
      timeoutMs: 20000,
    });
    if (typeof body?.data?.id !== 'string' || !body.data.id) {
      throw new Error('Invalid contact response');
    }
    return body.data.id;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ContactApiError(error.status, error.code, error.fields);
    }
    throw error;
  }
}
