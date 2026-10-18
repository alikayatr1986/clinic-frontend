import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { axePass, themedRender } from '@/test/utils';
function FullCard() {
  return (<Card>
  <CardHeader>
  <CardTitle>Rhinoplasty plan</CardTitle>
  <CardDescription>Surgeon-reviewed treatment summary</CardDescription>
  <CardAction>
  <span>★</span>
  </CardAction>
  </CardHeader>
  <CardContent>
  <p>Consultation details</p>
  </CardContent>
  <CardFooter>
  <span>Footer note</span>
  </CardFooter>
  </Card>);
}
describe('Card', () => {
  it('renders smoke with compound slots', () => {
  themedRender(<FullCard />);
  expect(screen.getByText('Rhinoplasty plan')).toBeInTheDocument();
  expect(screen.getByText('Surgeon-reviewed treatment summary')).toBeInTheDocument();
  expect(screen.getByText('Consultation details')).toBeInTheDocument();
  expect(screen.getByText('Footer note')).toBeInTheDocument();
  });
  it('carries semantic surface classes', () => {
  const { container } = themedRender(<FullCard />);
  const card = container.querySelector('[data-slot="card"]');
  expect(card).toHaveClass('bg-card');
  expect(card).toHaveClass('border-border');
  expect(container.querySelector('[data-slot="card-description"]')).toHaveClass('text-muted-foreground');
  });
  it('moves keyboard focus to an interactive child', async () => {
  const user = userEvent.setup();
  themedRender(<Card>
  <CardContent>
  <Button>Card action</Button>
  </CardContent>
  </Card>);
  await user.tab();
  expect(screen.getByRole('button', { name: 'Card action' })).toHaveFocus();
  });
  it('keeps text and hue classes identical in RTL', () => {
  const ltr = themedRender(<FullCard />, { dir: 'ltr', lang: 'en' });
  const ltrCard = ltr.container.querySelector('[data-slot="card"]');
  ltr.unmount();
  const rtl = themedRender(<Card>
  <CardHeader>
  <CardTitle>خطة العملية</CardTitle>
  <CardDescription>ملخص معتمد</CardDescription>
  </CardHeader>
  <CardContent>
  <p>تفاصيل الاستشارة</p>
  </CardContent>
  </Card>, { dir: 'rtl', lang: 'ar' });
  expect(rtl.container.firstElementChild).toHaveAttribute('dir', 'rtl');
  expect(rtl.container.firstElementChild).toHaveAttribute('lang', 'ar');
  expect(rtl.container.textContent).toContain('خطة العملية');
  expect(rtl.container.querySelector('[data-slot="card"]')).toHaveClass('bg-card');
  expect(ltrCard).toHaveClass('bg-card');
  });
  it('has zero axe violations', async () => {
  const { container } = themedRender(<FullCard />);
  await axePass(container);
  });
});
