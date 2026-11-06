import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '@/lib/api';
import { fetchVerificationPolicy, operateVerification } from './verification.service';

vi.mock('@/lib/api', () => ({ apiRequest: vi.fn() }));
afterEach(() => vi.clearAllMocks());

describe('verification API', () => {
  it('reads the policy envelope and forwards cancellation', async () => {
    const policy = { email: false, phone_call: true, whatsapp: false, telegram: true };
    const controller = new AbortController();
    vi.mocked(apiRequest).mockResolvedValueOnce({ data: policy });
    await expect(fetchVerificationPolicy(controller.signal)).resolves.toEqual(policy);
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/verification/policy', { signal: controller.signal });
    vi.mocked(apiRequest).mockResolvedValueOnce({ data: { email: false } });
    await expect(fetchVerificationPolicy()).rejects.toThrow('Verification policy unavailable');
  });

  it.each(['issue', 'resend', 'check'] as const)('posts %s and validates its response envelope', async (operation) => {
    const input = { method: 'phone_call' as const, destination: '+12025550123', recaptcha_token: 'captcha', challenge: 'challenge', flow: 'flow', code: '123456' };
    const response = operation === 'check' ? { proof: 'proof' } : { challenge: 'challenge', flow: 'flow' };
    const controller = new AbortController();
    vi.mocked(apiRequest).mockResolvedValueOnce({ data: response });
    await expect(operateVerification(operation, input, controller.signal)).resolves.toEqual(response);
    expect(apiRequest).toHaveBeenCalledWith(`/api/v1/verification/${operation}`, { method: 'POST', body: input, signal: controller.signal });
    vi.mocked(apiRequest).mockResolvedValueOnce({ data: {} });
    await expect(operateVerification(operation, input)).rejects.toThrow('Verification unavailable');
  });
});
