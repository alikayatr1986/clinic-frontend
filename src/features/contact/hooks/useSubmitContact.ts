"use client";

import { useEffect, useRef } from 'react';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { submitContact } from '@/features/contact/services/contact.service';
import type { SubmitContactArgs } from '@/features/contact/types/contact.types';

export function useSubmitContact(): UseMutationResult<
  string,
  Error,
  SubmitContactArgs
> {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return useMutation({
    mutationFn: ({ values, consent, locale, token, signal }: SubmitContactArgs) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (signal) {
        if (signal.aborted) {
          controller.abort(signal.reason);
        } else {
          signal.addEventListener(
            'abort',
            () => controller.abort(signal.reason),
            { once: true },
          );
        }
      }

      return submitContact(values, consent, locale, token, {
        signal: controller.signal,
      });
    },
    retry: false,
  });
}
