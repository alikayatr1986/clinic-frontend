import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';
import { axePass, themedRender } from '@/test/utils';
describe('Button', () => {
  it('renders smoke', () => {
  themedRender(<Button>Book consultation</Button>);
  expect(screen.getByRole('button', { name: 'Book consultation' })).toBeInTheDocument();
  });
  it('applies one semantic class per variant', () => {
  const { rerender, container } = themedRender(<Button variant="default">CTA</Button>);
  expect(container.querySelector('button')).toHaveClass('bg-primary', 'hover:bg-primary-hover');
  rerender(<Button variant="secondary">CTA</Button>);
  expect(container.querySelector('button')).toHaveClass('bg-secondary');
  rerender(<Button variant="outline">CTA</Button>);
  expect(container.querySelector('button')).toHaveClass('border-border', 'text-foreground');
  rerender(<Button variant="ghost">CTA</Button>);
  expect(container.querySelector('button')).toHaveClass('hover:bg-accent');
  rerender(<Button variant="destructive">CTA</Button>);
  expect(container.querySelector('button')).toHaveClass('bg-destructive');
  rerender(<Button variant="link">CTA</Button>);
  expect(container.querySelector('button')).toHaveClass('text-primary');
  });
  it('applies size classes', () => {
  const { rerender, container } = themedRender(<Button size="default">CTA</Button>);
  expect(container.querySelector('button')).toHaveClass('h-12');
  expect(container.querySelector('button')).toHaveClass('min-h-12');
  rerender(<Button size="sm">CTA</Button>);
  expect(container.querySelector('button')).toHaveClass('h-9');
  rerender(<Button size="lg">CTA</Button>);
  expect(container.querySelector('button')).toHaveClass('px-8');
  rerender(<Button size="icon" aria-label="Close menu">×</Button>);
  expect(container.querySelector('button')).toHaveClass('w-12');
  });
  it('forwards classes through asChild Slot to an anchor', () => {
  themedRender(<Button asChild variant="default">
  <a href="/booking">Book consultation</a>
  </Button>);
  const link = screen.getByRole('link', { name: 'Book consultation' });
  expect(link.tagName).toBe('A');
  expect(link).toHaveClass('bg-primary');
  });
  it('supports keyboard focus and activation', async () => {
  const user = userEvent.setup();
  const onClick = { current: 0 };
  themedRender(<Button onClick={() => (onClick.current += 1)}>Focus me</Button>);
  const button = screen.getByRole('button', { name: 'Focus me' });
  await user.tab();
  expect(button).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(onClick.current).toBe(1);
  });
  it('marks disabled with attribute and opacity class', () => {
  const { container } = themedRender(<Button disabled>Disabled</Button>);
  const button = container.querySelector('button');
  expect(button).toBeDisabled();
  expect(button).toHaveClass('disabled:opacity-50');
  });
  it('keeps text and hue classes identical in RTL', () => {
  const ltr = themedRender(<Button variant="default">Book consultation</Button>, {
  dir: 'ltr',
  lang: 'en',
  });
  const ltrButton = ltr.container.querySelector('button');
  const ltrClasses = ltrButton?.className ?? '';
  ltr.unmount();
  const rtl = themedRender(<Button variant="default">احجز استشارة</Button>, { dir: 'rtl', lang: 'ar' });
  const rtlButton = rtl.container.querySelector('button');
  expect(rtl.container.firstElementChild).toHaveAttribute('dir', 'rtl');
  expect(rtl.container.firstElementChild).toHaveAttribute('lang', 'ar');
  expect(rtlButton).toHaveClass('bg-primary');
  expect(ltrButton).toHaveClass('bg-primary');
  expect(rtl.container.textContent).toContain('احجز استشارة');
  expect(ltrClasses).toContain('bg-primary');
  });
  it.each([['light', 'ltr'], ['light', 'rtl'], ['dark', 'ltr'], ['dark', 'rtl']] as const)('supports wrapping hero links in %s %s', async (theme, dir) => {
    const user = userEvent.setup();
    const { container } = themedRender(<Button asChild variant="outline" size="hero"><a href="#treatments">Explore Treatments</a></Button>, { theme, dir });
    const link = screen.getByRole('link', { name: 'Explore Treatments' });
    expect(link).toHaveClass('h-auto', 'min-h-12', 'whitespace-normal', 'focus-visible:ring-2');
    await user.tab();
    expect(link).toHaveFocus();
    await axePass(container);
  });
  it('has zero axe violations' , async () => {
  const { container } = themedRender(<Button>Book consultation</Button>);
  await axePass(container);
  });
});
