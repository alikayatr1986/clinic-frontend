import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { contactKeys, useConsent } from './useConsent';
import { fetchConsent } from '@/features/contact/services/contact.service';

vi.mock('@/features/contact/services/contact.service', () => ({
  fetchConsent: vi.fn(),
}));

function createTestWrapper(client?: QueryClient) {
  const queryClient =
    client ??
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

  return function TestWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useConsent hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('generates stable, locale-scoped query keys', () => {
    expect(contactKeys.all).toEqual(['contact']);
    expect(contactKeys.consent('en')).toEqual(['contact', 'consent', 'en']);
    expect(contactKeys.consent('ar')).toEqual(['contact', 'consent', 'ar']);
  });

  it('loads consent for the specified locale and provides ready data', async () => {
    vi.mocked(fetchConsent).mockResolvedValueOnce({
      version: 'v1',
      text: 'Consent agreement text',
    });

    const { result } = renderHook(() => useConsent('en'), {
      wrapper: createTestWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isRefreshing).toBe(true);
    expect(result.current.consent).toBeNull();
    expect(result.current.error).toBe(false);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.consent).toEqual({
      version: 'v1',
      text: 'Consent agreement text',
    });
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.error).toBe(false);
    expect(fetchConsent).toHaveBeenCalledTimes(1);
    expect(fetchConsent).toHaveBeenCalledWith('en', { signal: expect.any(AbortSignal) });
  });

  it('isolates cache entries per locale without cross-locale leaks', async () => {
    vi.mocked(fetchConsent).mockImplementation(async (locale) => {
      if (locale === 'ar') {
        return { version: 'v1-ar', text: 'موافقة' };
      }
      return { version: 'v1-en', text: 'Agreement' };
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = createTestWrapper(queryClient);

    const { result, rerender } = renderHook(({ lang }: { lang: string }) => useConsent(lang), {
      initialProps: { lang: 'en' },
      wrapper,
    });

    await waitFor(() => expect(result.current.consent?.version).toBe('v1-en'));
    expect(result.current.consent?.text).toBe('Agreement');

    // Switch to Arabic
    rerender({ lang: 'ar' });
    await waitFor(() => expect(result.current.consent?.version).toBe('v1-ar'));
    expect(result.current.consent?.text).toBe('موافقة');

    // Switch back to English — should reuse cached data without re-fetching
    rerender({ lang: 'en' });
    expect(result.current.consent?.version).toBe('v1-en');
    expect(result.current.consent?.text).toBe('Agreement');
    expect(fetchConsent).toHaveBeenCalledTimes(2); // exactly 1 for en, 1 for ar
  });

  it('handles load failures without automatic retry', async () => {
    vi.mocked(fetchConsent).mockRejectedValue(new Error('Consent unavailable'));

    const { result } = renderHook(() => useConsent('en'), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBe(true));

    expect(result.current.consent).toBeNull();
    expect(fetchConsent).toHaveBeenCalledTimes(1); // strictly no automatic retry
  });

  it('recovers when user explicitly triggers retry after failure', async () => {
    vi.mocked(fetchConsent)
      .mockRejectedValueOnce(new Error('Network glitch'))
      .mockResolvedValueOnce({ version: 'v2', text: 'Recovered consent' });

    const { result } = renderHook(() => useConsent('en'), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.consent).toBeNull();

    // User triggers explicit retry
    await act(async () => {
      await result.current.retry();
    });

    await waitFor(() => expect(result.current.error).toBe(false));
    expect(result.current.consent).toEqual({
      version: 'v2',
      text: 'Recovered consent',
    });
    expect(fetchConsent).toHaveBeenCalledTimes(2);
  });

  it('aborts the in-flight request when unmounting mid-flight', async () => {
    let capturedSignal: AbortSignal | undefined;
    vi.mocked(fetchConsent).mockImplementation((_locale, options) => {
      capturedSignal = options?.signal;
      return new Promise(() => {}); // never resolves
    });

    const { unmount } = renderHook(() => useConsent('en'), {
      wrapper: createTestWrapper(),
    });

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(false);

    unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });
});

