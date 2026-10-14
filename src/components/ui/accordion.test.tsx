import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { axePass, themedRender } from '@/test/utils';

function FaqAccordion() {
  return (
    <Accordion type="single" collapsible defaultValue="item-1">
      <AccordionItem value="item-1">
        <AccordionTrigger>Is surgery safe?</AccordionTrigger>
        <AccordionContent>Safety answer</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How long is recovery?</AccordionTrigger>
        <AccordionContent>Recovery answer</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

describe('Accordion', () => {
  it('renders smoke with triggers and content', () => {
    themedRender(<FaqAccordion />);
    expect(screen.getByText('Is surgery safe?')).toBeInTheDocument();
    expect(screen.getByText('How long is recovery?')).toBeInTheDocument();
  });

  it('carries semantic trigger classes', () => {
    const { container } = themedRender(<FaqAccordion />);
    const trigger = container.querySelector('[data-slot="accordion-trigger"]');
    expect(trigger).toHaveClass('text-start');
    expect(trigger).toHaveClass('min-h-12');
    expect(container.querySelector('[data-slot="accordion-item"]')).toHaveClass(
      'border-border',
    );
  });

  it('opens on click and moves focus with arrow keys per Radix contract', async () => {
    const user = userEvent.setup();
    themedRender(<FaqAccordion />);
    const first = screen.getByText('Is surgery safe?');
    const second = screen.getByText('How long is recovery?');

    first.focus();
    expect(first).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(second).toHaveFocus();

    await user.click(second);
    await waitFor(() => {
      expect(screen.getByText('Recovery answer')).toBeVisible();
    });
  });

  it('supports tabbing to the first trigger', async () => {
    const user = userEvent.setup();
    themedRender(<FaqAccordion />);
    await user.tab();
    expect(screen.getByText('Is surgery safe?')).toHaveFocus();
  });

  it('keeps text and hue classes identical in RTL', () => {
    const rtl = themedRender(
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>هل العملية آمنة؟</AccordionTrigger>
          <AccordionContent>جواب الأمان</AccordionContent>
        </AccordionItem>
      </Accordion>,
      { dir: 'rtl', lang: 'ar' },
    );
    expect(rtl.container.firstElementChild).toHaveAttribute('dir', 'rtl');
    expect(rtl.container.firstElementChild).toHaveAttribute('lang', 'ar');
    expect(screen.getByText('هل العملية آمنة؟')).toBeInTheDocument();
    expect(rtl.container.querySelector('[data-slot="accordion-trigger"]')).toHaveClass(
      'text-start',
    );
  });

  it('has zero axe violations', async () => {
    const { container } = themedRender(<FaqAccordion />);
    await axePass(container);
  });
});
