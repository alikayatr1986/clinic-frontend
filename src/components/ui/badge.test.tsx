import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge } from '@/components/ui/badge';
import { axePass, themedRender } from '@/test/utils';
describe('Badge', () => {
  it('renders smoke', () => {
  themedRender(<Badge>United Kingdom</Badge>);
  expect(screen.getByText('United Kingdom')).toBeInTheDocument();
  });
  it('applies one semantic class per variant', () => {
  const { rerender, container } = themedRender(<Badge variant="default">UK</Badge>);
  expect(container.querySelector('[data-slot="badge"]')).toHaveClass('text-muted-foreground');
  rerender(<Badge variant="secondary">UK</Badge>);
  expect(container.querySelector('[data-slot="badge"]')).toHaveClass('bg-secondary');
  rerender(<Badge variant="midnight">UK</Badge>);
  expect(container.querySelector('[data-slot="badge"]')).toHaveClass('bg-foreground');
  rerender(<Badge variant="promo">UK</Badge>);
  expect(container.querySelector('[data-slot="badge"]')).toHaveClass('bg-primary');
  rerender(<Badge variant="destructive">UK</Badge>);
  expect(container.querySelector('[data-slot="badge"]')).toHaveClass('bg-destructive');
  rerender(<Badge variant="outline">UK</Badge>);
  expect(container.querySelector('[data-slot="badge"]')).toHaveClass('text-foreground');
  });
  it('supports keyboard focus', async () => {
  const user = userEvent.setup();
  themedRender(<Badge tabIndex={0}>Focusable badge</Badge>);
  await user.tab();
  expect(screen.getByText('Focusable badge')).toHaveFocus();
  });
  it('keeps text and hue classes identical in RTL', () => {
  const rtl = themedRender(<Badge variant="promo">عرض خاص</Badge>, {
  dir: 'rtl',
  lang: 'ar',
  });
  expect(rtl.container.firstElementChild).toHaveAttribute('dir', 'rtl');
  expect(rtl.container.firstElementChild).toHaveAttribute('lang', 'ar');
  expect(screen.getByText('عرض خاص')).toBeInTheDocument();
  expect(rtl.container.querySelector('[data-slot="badge"]')).toHaveClass('bg-primary');
  });
  it('has zero axe violations', async () => {
  const { container } = themedRender(<Badge variant="promo">Limited offer</Badge>);
  await axePass(container);
  });
});
