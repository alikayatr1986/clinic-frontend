import * as React from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { axe } from 'jest-axe';
import { expect } from 'vitest';

export type Theme = 'light' | 'dark';
export type Direction = 'ltr' | 'rtl';

export interface ThemedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: Theme;
  dir?: Direction;
  lang?: string;
}

/** Shared themed + dir/lang render wrapper. Keeps per-file duplication out of ui tests. */
export function themedRender(
  ui: React.ReactElement,
  { theme = 'light', dir = 'ltr', lang = 'en', ...options }: ThemedRenderOptions = {},
): RenderResult {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <div dir={dir} lang={lang} className={theme === 'dark' ? 'dark' : undefined}>
        {children}
      </div>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}

/** Assert zero axe violations for a rendered container. */
export async function axePass(container: HTMLElement): Promise<void> {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}
