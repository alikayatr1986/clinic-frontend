import { apiRequest } from '@/lib/api';
import type { VerificationPolicy, VerificationRequest, VerificationResponse } from '@/features/contact/types/contact.types';

export async function fetchVerificationPolicy(signal?: AbortSignal): Promise<VerificationPolicy> {
  const result = await apiRequest<{ data: VerificationPolicy }>('/api/v1/verification/policy', { signal });
  const policy = result?.data;
  if (!policy || (['email', 'phone_call', 'whatsapp', 'telegram'] as const).some((method) => typeof policy[method] !== 'boolean')) {
    throw new Error('Verification policy unavailable');
  }
  return policy;
}

export async function operateVerification(operation: 'issue' | 'resend' | 'check' | 'fallback' | 'undelivered', input: VerificationRequest, signal?: AbortSignal): Promise<VerificationResponse> {
  const result = await apiRequest<{ data: VerificationResponse }>(`/api/v1/verification/${operation}`, { method: 'POST', body: input, signal });
  if (!result?.data || (operation === 'check' ? !result.data.proof : !result.data.challenge || !result.data.flow)) {
    throw new Error('Verification unavailable');
  }
  return result.data;
}
