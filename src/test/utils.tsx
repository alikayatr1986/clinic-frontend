import * as React from "react";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "jest-axe";
import { expect, vi } from "vitest";

import { withFallback } from "@/i18n/request";
import enMessages from "../../messages/en.json";
import arMessages from "../../messages/ar.json";
import type { NavItem } from "@/types/nav.types";

export type Theme = "light" | "dark";
export type Direction = "ltr" | "rtl";
export type TestLocale = "en" | "ar";

export interface ThemedRenderOptions extends Omit<RenderOptions, "wrapper"> {
  theme?: Theme;
  dir?: Direction;
  lang?: string;
  locale?: TestLocale;
  queryClient?: QueryClient;
}

const TEST_MESSAGES: Record<TestLocale, typeof enMessages> = {
  en: enMessages,
  ar: arMessages,
};

export function themedRender(
  ui: React.ReactElement,
  {
    theme = "light",
    dir = "ltr",
    lang = "en",
    locale = "en",
    queryClient,
    ...options
  }: ThemedRenderOptions = {},
): RenderResult {
  const testQueryClient =
    queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <div
        dir={dir}
        lang={lang}
        className={theme === "dark" ? "dark" : undefined}
      >
        <NextIntlClientProvider
          locale={locale}
          messages={withFallback(TEST_MESSAGES.en, TEST_MESSAGES[locale])}
        >
          <QueryClientProvider client={testQueryClient}>
            {children}
          </QueryClientProvider>
        </NextIntlClientProvider>
      </div>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}

export function enNavLabel(item: NavItem): string {
  return enMessages.nav[item.labelKey];
}

export async function axePass(container: HTMLElement): Promise<void> {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

export interface NextRouterSpies {
  refresh: ReturnType<typeof vi.fn>;
  push: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  back: ReturnType<typeof vi.fn>;
  forward: ReturnType<typeof vi.fn>;
  prefetch: ReturnType<typeof vi.fn>;
}

let routerSpies: NextRouterSpies | undefined;

export function installRouterSpies(): NextRouterSpies {
  routerSpies = {
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  };
  return routerSpies;
}

export function nextRouterSpies(): NextRouterSpies {
  if (!routerSpies) {
    throw new Error(
      "next/navigation is not mocked with installRouterSpies in this suite",
    );
  }
  return routerSpies;
}
