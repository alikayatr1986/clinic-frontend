import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { axePass, themedRender } from '@/test/utils';

describe('Label', () => {
  it('renders smoke', () => {
    themedRender(<Label htmlFor="name">Full name</Label>);
    expect(screen.getByText('Full name')).toBeInTheDocument();
  });

  it('carries the single CVA variant with peer-disabled handling', () => {
    const { container } = themedRender(<Label htmlFor="name">Full name</Label>);
    const label = container.querySelector('label');
    expect(label).toHaveClass('font-medium');
    // Structural guard for the peer-disabled contract.
    expect(label?.className).toContain('peer-disabled:opacity-50');
  });

  it('moves focus to the associated control on click', async () => {
    const user = userEvent.setup();
    themedRender(
      <div>
        <Label htmlFor="labelled-input">Full name</Label>
        <Input id="labelled-input" aria-label="Full name" />
      </div>,
    );
    await user.click(screen.getByText('Full name'));
    expect(screen.getByLabelText('Full name')).toHaveFocus();
  });

  it('keeps text and classes identical in RTL', () => {
    const rtl = themedRender(<Label htmlFor="name">الاسم الكامل</Label>, {
      dir: 'rtl',
      lang: 'ar',
    });
    expect(rtl.container.firstElementChild).toHaveAttribute('dir', 'rtl');
    expect(rtl.container.firstElementChild).toHaveAttribute('lang', 'ar');
    expect(screen.getByText('الاسم الكامل')).toBeInTheDocument();
    expect(rtl.container.querySelector('label')).toHaveClass('font-medium');
  });

  it('has zero axe violations', async () => {
    const { container } = themedRender(
      <div>
        <Label htmlFor="axe-input">Full name</Label>
        <Input id="axe-input" aria-label="Full name" />
      </div>,
    );
    await axePass(container);
  });
});
