'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchVerificationPolicy, operateVerification } from '@/features/contact/services/verification.service';
import { contactKeys } from '@/features/contact/hooks/useConsent';
import type { VerificationMutationArgs } from '@/features/contact/types/contact.types';

export function useVerification() {
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const policy = useQuery({ queryKey: contactKeys.verificationPolicy(), queryFn: ({ signal }) => fetchVerificationPolicy(signal), retry: false, staleTime: 0 });
  const mutation = useMutation({
    mutationFn: ({ operation, input, signal }: VerificationMutationArgs) => {
      const active = new AbortController();
      controller.current = active;
      if (signal?.aborted) active.abort(signal.reason);
      else signal?.addEventListener('abort', () => active.abort(signal.reason), { once: true });
      return operateVerification(operation, input, active.signal);
    },
    retry: false,
  });
  return { policy, mutation };
}
