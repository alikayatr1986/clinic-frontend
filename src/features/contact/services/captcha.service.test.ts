import { afterEach, describe, expect, it, vi } from 'vitest';
import { freshCaptchaToken } from './captcha.service';
afterEach(() => { delete window.grecaptcha; vi.useRealTimers(); });
describe('fresh CAPTCHA', () => {
  it('executes afresh for every attempt', async () => {
    const execute = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    window.grecaptcha = { ready: (callback) => callback(), execute };
    expect(await freshCaptchaToken('site', 'lead')).toBe('first'); expect(await freshCaptchaToken('site', 'lead')).toBe('second'); expect(execute).toHaveBeenCalledTimes(2);
  });
  it('fails closed for missing provider', async () => { await expect(freshCaptchaToken('site', 'lead')).rejects.toThrow(); });
  it('times out a stalled provider', async () => {
    vi.useFakeTimers(); window.grecaptcha = { ready: () => {}, execute: vi.fn() };
    const result = expect(freshCaptchaToken('site', 'lead')).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(15000); await result;
  });
});
