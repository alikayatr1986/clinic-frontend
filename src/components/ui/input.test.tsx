import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';
import { axePass, themedRender } from '@/test/utils';
describe('Input', () => {
  it('renders smoke', () => {
  themedRender(<Input aria-label="Full name" placeholder="Full name"/>);
  expect(screen.getByLabelText('Full name')).toBeInTheDocument();
  });
  it('carries base semantic classes', () => {
  const { container } = themedRender(<Input aria-label="Email"/>);
  const input = container.querySelector('input');
  expect(input).toHaveClass('border-input');
  expect(input).toHaveClass('text-start');
  expect(input).toHaveClass('h-12');
  });
  it('exposes the invalid-state rule classes', () => {
  const { container } = themedRender(<Input aria-label="Email" aria-invalid/>);
  const input = container.querySelector('input');
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input?.className).toContain('aria-invalid:border-destructive');
  });
  it('links the invalid message via describedby and role=alert', () => {
  themedRender(<div>
  <Input aria-label="Email" aria-invalid aria-describedby="email-error"/>
  <p id="email-error" role="alert">
  Enter a valid email
  </p>
  </div>);
  const input = screen.getByLabelText('Email');
  const message = screen.getByRole('alert');
  expect(message).toHaveTextContent('Enter a valid email');
  expect(input).toHaveAttribute('aria-describedby', 'email-error');
  });
  it('supports keyboard focus and typing', async () => {
  const user = userEvent.setup();
  themedRender(<Input aria-label="Full name"/>);
  const input = screen.getByLabelText('Full name');
  await user.tab();
  expect(input).toHaveFocus();
  await user.type(input, 'Sara');
  expect(input).toHaveValue('Sara');
  });
  it('marks disabled with attribute and opacity class', () => {
  const { container } = themedRender(<Input aria-label="Email" disabled/>);
  const input = container.querySelector('input');
  expect(input).toBeDisabled();
  expect(input?.className).toContain('disabled:opacity-50');
  });
  it('keeps hue classes identical in RTL', () => {
  const ltr = themedRender(<Input aria-label="Full name" placeholder="Full name"/>, {
  dir: 'ltr',
  lang: 'en',
  });
  ltr.unmount();
  const rtl = themedRender(<Input aria-label="الاسم الكامل" placeholder="الاسم الكامل"/>, {
  dir: 'rtl',
  lang: 'ar',
  });
  expect(rtl.container.firstElementChild).toHaveAttribute('dir', 'rtl');
  expect(rtl.container.firstElementChild).toHaveAttribute('lang', 'ar');
  const rtlInput = rtl.container.querySelector('input');
  expect(rtlInput).toHaveClass('border-input');
  expect(rtlInput).toHaveClass('text-start');
  expect(screen.getByPlaceholderText('الاسم الكامل')).toBeInTheDocument();
  });
  it('has zero axe violations', async () => {
  const { container } = themedRender(<Input aria-label="Full name"/>);
  await axePass(container);
  });
});
