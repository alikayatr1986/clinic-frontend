import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, ApiError } from '@/lib/api';
import { ContactApiError, fetchConsent, submitContact } from './contact.service';

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    readonly fields: string[];
    constructor(status: number, code = '', fields: string[] = [], cause?: unknown) {
      super(`API request failed with status ${status}`, { cause });
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
      this.fields = fields;
    }
  },
  isAbortError: (error: unknown) => {
    if (typeof error !== 'object' || error === null) return false;
    const name = (error as { name?: unknown }).name;
    return name === 'AbortError' || name === 'TimeoutError';
  },
}));

const values = {
  name: ' Test ',
  country: 'country',
  city: 'city',
  email: ' Person@Example.test ',
  phone: '+1 (234) 567-8901',
  procedure: 'rhinoplasty',
  preferred_contact: 'email' as const,
  message: ' ',
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('contact transport service', () => {
  describe('fetchConsent', () => {
    it('loads current localized consent via apiRequest with lang query param', async () => {
      vi.mocked(apiRequest).mockResolvedValueOnce({ version: 'v1', text: 'Consent' });

      const result = await fetchConsent('ar');

      expect(result).toEqual({ version: 'v1', text: 'Consent' });
      expect(apiRequest).toHaveBeenCalledWith('/api/v1/consent', {
        query: { lang: 'ar' },
        signal: undefined,
      });
    });

    it('defaults non-ar locales to en lang query param', async () => {
      vi.mocked(apiRequest).mockResolvedValueOnce({ version: 'v1', text: 'Consent' });

      await fetchConsent('en');

      expect(apiRequest).toHaveBeenCalledWith('/api/v1/consent', {
        query: { lang: 'en' },
        signal: undefined,
      });
    });

    it('forwards caller signal to apiRequest', async () => {
      vi.mocked(apiRequest).mockResolvedValueOnce({ version: 'v1', text: 'Consent' });
      const controller = new AbortController();

      await fetchConsent('en', { signal: controller.signal });

      expect(apiRequest).toHaveBeenCalledWith('/api/v1/consent', {
        query: { lang: 'en' },
        signal: controller.signal,
      });
    });

    it('throws Consent unavailable when transport throws ApiError', async () => {
      vi.mocked(apiRequest).mockRejectedValueOnce(new ApiError(500, 'INTERNAL_ERROR'));

      await expect(fetchConsent('en')).rejects.toThrow('Consent unavailable');
    });

    it('throws Consent unavailable when response body is invalid or missing fields', async () => {
      vi.mocked(apiRequest).mockResolvedValueOnce({ version: 'v1' }); // missing text

      await expect(fetchConsent('en')).rejects.toThrow('Consent unavailable');
    });

    it('propagates abort / timeout cancellation errors directly', async () => {
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      vi.mocked(apiRequest).mockRejectedValueOnce(abortError);

      await expect(fetchConsent('en')).rejects.toThrow('aborted');
    });
  });

  describe('submitContact', () => {
    it('POSTs normalized values through apiRequest and returns only the ID', async () => {
      vi.mocked(apiRequest).mockResolvedValueOnce({ data: { id: 'opaque-lead-id' } });

      const result = await submitContact(
        values,
        { version: 'v1', text: 'Consent' },
        'en',
        'fresh-token',
      );

      expect(result).toBe('opaque-lead-id');
      expect(apiRequest).toHaveBeenCalledWith('/api/v1/leads', {
        method: 'POST',
        headers: { 'Accept-Language': 'en' },
        body: {
          name: 'Test',
          country: 'country',
          city: 'city',
          email: 'person@example.test',
          phone: '+12345678901',
          procedure: 'rhinoplasty',
          preferred_contact: 'email',
          message: '',
          consent_accepted: true,
          consent_version: 'v1',
          lang: 'en',
          recaptcha_token: 'fresh-token',
        },
        signal: undefined,
        timeoutMs: 20000,
      });
    });

    it('forwards caller signal to apiRequest', async () => {
      vi.mocked(apiRequest).mockResolvedValueOnce({ data: { id: 'opaque-lead-id' } });
      const controller = new AbortController();

      await submitContact(
        values,
        { version: 'v1', text: 'Consent' },
        'en',
        'fresh-token',
        { signal: controller.signal },
      );

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/leads',
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('maps ApiError to ContactApiError preserving status, code, and fields without exposing server text', async () => {
      vi.mocked(apiRequest).mockRejectedValueOnce(
        new ApiError(422, 'VALIDATION', ['email', 'phone']),
      );

      await expect(
        submitContact(values, { version: 'v1', text: 'Consent' }, 'en', 'fresh-token'),
      ).rejects.toMatchObject({
        name: 'ContactApiError',
        status: 422,
        code: 'VALIDATION',
        fields: ['email', 'phone'],
        message: 'Contact request failed',
      });
    });

    it('does not treat malformed success as persistence confirmation', async () => {
      vi.mocked(apiRequest).mockResolvedValueOnce({});

      await expect(
        submitContact(values, { version: 'v1', text: 'Consent' }, 'en', 'fresh-token'),
      ).rejects.toThrow('Invalid contact response');
      expect(new ContactApiError(403, 'CHALLENGE_REQUIRED').message).not.toContain(values.email);
    });

    it('propagates abort / timeout cancellation errors directly', async () => {
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      vi.mocked(apiRequest).mockRejectedValueOnce(abortError);

      await expect(
        submitContact(values, { version: 'v1', text: 'Consent' }, 'en', 'fresh-token'),
      ).rejects.toThrow('aborted');
    });
  });
});
