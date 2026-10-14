import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Textarea } from '@/components/ui/textarea';
import { axePass, themedRender } from '@/test/utils';

describe('Textarea', () => {
  it('renders smoke', () => {
    themedRender(<Textarea aria-label="Message" placeholder="Message" />);
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
  });

  it('carries the deferred structural rule classes', () => {
    const { container } = themedRender(<Textarea aria-label="Message" />);
    const area = container.querySelector('textarea');
    // jsdom cannot compute cascade styles: assert the rule-carrying classes exist.
    expect(area).toHaveClass('max-h-96');
    expect(area).toHaveClass('min-h-12');
    expect(area).toHaveClass('border-input');
    expect(area).toHaveClass('text-start');
  });

  it('exposes the invalid-state rule classes', () => {
    const { container } = themedRender(<Textarea aria-label="Message" aria-invalid />);
    const area = container.querySelector('textarea');
    expect(area).toHaveAttribute('aria-invalid', 'true');
    expect(area?.className).toContain('aria-invalid:border-destructive');
  });

  it('links the invalid message via describedby and role=alert', () => {
    themedRender(
      <div>
        <Textarea aria-label="Message" aria-invalid aria-describedby="message-error" />
        <p id="message-error" role="alert">
          Tell us about your case
        </p>
      </div>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Tell us about your case');
    expect(screen.getByLabelText('Message')).toHaveAttribute('aria-describedby', 'message-error');
  });

  it('supports keyboard focus and typing', async () => {
    const user = userEvent.setup();
    themedRender(<Textarea aria-label="Message" />);
    const area = screen.getByLabelText('Message');
    await user.tab();
    expect(area).toHaveFocus();
    await user.type(area, 'Hello');
    expect(area).toHaveValue('Hello');
  });

  it('marks disabled with attribute and opacity class', () => {
    const { container } = themedRender(<Textarea aria-label="Message" disabled />);
    const area = container.querySelector('textarea');
    expect(area).toBeDisabled();
    expect(area?.className).toContain('disabled:opacity-50');
  });

  it('keeps hue classes identical in RTL', () => {
    const rtl = themedRender(<Textarea aria-label="رسالتك" placeholder="رسالتك" />, {
      dir: 'rtl',
      lang: 'ar',
    });
    expect(rtl.container.firstElementChild).toHaveAttribute('dir', 'rtl');
    expect(rtl.container.firstElementChild).toHaveAttribute('lang', 'ar');
    const area = rtl.container.querySelector('textarea');
    expect(area).toHaveClass('border-input');
    expect(area).toHaveClass('max-h-96');
    expect(screen.getByPlaceholderText('رسالتك')).toBeInTheDocument();
  });

  it('has zero axe violations', async () => {
    const { container } = themedRender(<Textarea aria-label="Message" />);
    await axePass(container);
  });
});
