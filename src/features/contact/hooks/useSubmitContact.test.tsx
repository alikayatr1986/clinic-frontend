import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useSubmitContact } from './useSubmitContact';
import { ContactApiError, submitContact } from '@/features/contact/services/contact.service';
import type { Consent, ContactValues } from '@/features/contact/types/contact.types';

vi.mock('@/features/contact/services/contact.service', async (original) => ({
  ...await original<typeof import('@/features/contact/services/contact.service')>(),
  submitContact: vi.fn(),
}));

function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
    },
  });

  return function TestWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const mockValues: ContactValues = {
  name: 'Jane Doe',
  country: 'country-code',
  city: 'city-code',
  email: 'jane@example.com',
  phone: '+1234567890',
  procedure: 'rhinoplasty',
  preferred_contact: 'email',
  message: 'Hello clinic',
};

const mockConsent: Consent = {
  version: 'v1',
  text: 'Consent text',
};

describe('useSubmitContact hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('executes a single submission via submitContact and returns the lead ID', async () => {
    vi.mocked(submitContact).mockResolvedValueOnce('lead-123');

    const { result } = renderHook(() => useSubmitContact(), {
      wrapper: createTestWrapper(),
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);

    let id: string | undefined;
    await act(async () => {
      id = await result.current.mutateAsync({
        values: mockValues,
        consent: mockConsent,
        locale: 'en',
        token: 'token-abc',
      });
    });

    expect(id).toBe('lead-123');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isPending).toBe(false);
    expect(submitContact).toHaveBeenCalledTimes(1);
    expect(submitContact).toHaveBeenCalledWith(
      mockValues,
      mockConsent,
      'en',
      'token-abc',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('strictly disables automatic retries when submission fails', async () => {
    const apiError = new ContactApiError(422, 'VALIDATION', ['email']);
    vi.mocked(submitContact).mockRejectedValue(apiError);

    const { result } = renderHook(() => useSubmitContact(), {
      wrapper: createTestWrapper(),
    });

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.mutateAsync({
          values: mockValues,
          consent: mockConsent,
          locale: 'en',
          token: 'token-abc',
        });
      } catch (err) {
        caughtError = err;
      }
    });

    expect(caughtError).toBe(apiError);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(apiError);
    // Crucial check: exactly one call, no automatic retry
    expect(submitContact).toHaveBeenCalledTimes(1);
  });

  it('aborts the in-flight submission request when the component unmounts', async () => {
    let capturedSignal: AbortSignal | undefined;
    vi.mocked(submitContact).mockImplementation((_v, _c, _l, _t, options) => {
      capturedSignal = options?.signal;
      return new Promise(() => {}); // never resolves
    });

    const { result, unmount } = renderHook(() => useSubmitContact(), {
      wrapper: createTestWrapper(),
    });

    // Start mutation without awaiting resolution
    act(() => {
      result.current.mutate({
        values: mockValues,
        consent: mockConsent,
        locale: 'en',
        token: 'token-abc',
      });
    });

    await waitFor(() => expect(capturedSignal).toBeDefined());
    expect(capturedSignal?.aborted).toBe(false);

    // Unmount while mutation is in-flight
    unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });

  it('forwards caller signal cancellation to submitContact', async () => {
    let capturedSignal: AbortSignal | undefined;
    vi.mocked(submitContact).mockImplementation((_v, _c, _l, _t, options) => {
      capturedSignal = options?.signal;
      return new Promise(() => {}); // never resolves
    });

    const { result } = renderHook(() => useSubmitContact(), {
      wrapper: createTestWrapper(),
    });

    const callerController = new AbortController();

    act(() => {
      result.current.mutate({
        values: mockValues,
        consent: mockConsent,
        locale: 'en',
        token: 'token-abc',
        signal: callerController.signal,
      });
    });

    await waitFor(() => expect(capturedSignal).toBeDefined());
    expect(capturedSignal?.aborted).toBe(false);

    // Caller aborts
    callerController.abort();

    expect(capturedSignal?.aborted).toBe(true);
  });
});
