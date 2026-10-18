import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { axePass, themedRender } from '@/test/utils';
function ConsultDialog() {
  return (<Dialog>
  <DialogTrigger>Book consultation</DialogTrigger>
  <DialogContent>
  <DialogTitle>Confirm consultation</DialogTitle>
  <DialogDescription>We will call you to confirm the time.</DialogDescription>
  <button type="button">Confirm</button>
  </DialogContent>
  </Dialog>);
}
describe('Dialog', () => {
  it('renders smoke with a trigger', () => {
  themedRender(<ConsultDialog />);
  expect(screen.getByText('Book consultation')).toBeInTheDocument();
  });
  it('carries semantic overlay and surface classes when open', async () => {
  const user = userEvent.setup();
  const { container } = themedRender(<ConsultDialog />);
  await user.click(screen.getByText('Book consultation'));
  const dialog = await screen.findByRole('dialog');
  expect(dialog).toHaveClass('bg-card');
  expect(dialog).toHaveClass('border-border');
  const overlay = document.body.querySelector('[data-slot="dialog-overlay"]');
  expect(overlay?.className).toContain('bg-midnight-950/60');
  expect(container).toBeInTheDocument();
  });
  it('moves focus into the dialog and closes on Escape', async () => {
  const user = userEvent.setup();
  themedRender(<ConsultDialog />);
  await user.click(screen.getByText('Book consultation'));
  const dialog = await screen.findByRole('dialog');
  await waitFor(() => {
  expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });
  await user.keyboard('{Escape}');
  await waitFor(() => {
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  });
  it('keeps text and hue classes identical in RTL', async () => {
  const user = userEvent.setup();
  const rtl = themedRender(<Dialog>
  <DialogTrigger>احجز استشارة</DialogTrigger>
  <DialogContent>
  <DialogTitle>تأكيد الاستشارة</DialogTitle>
  <DialogDescription>سنتصل بك لتأكيد الموعد.</DialogDescription>
  </DialogContent>
  </Dialog>, { dir: 'rtl', lang: 'ar' });
  expect(rtl.container.firstElementChild).toHaveAttribute('dir', 'rtl');
  expect(rtl.container.firstElementChild).toHaveAttribute('lang', 'ar');
  await user.click(screen.getByText('احجز استشارة'));
  const dialog = await screen.findByRole('dialog');
  expect(dialog).toHaveClass('bg-card');
  expect(screen.getByText('تأكيد الاستشارة')).toBeInTheDocument();
  });
  it('localizes the Close surfaces from the Arabic catalog (story 4 matrix)', async () => {
  const user = userEvent.setup();
  themedRender(<ConsultDialog />, { locale: 'ar' });
  await user.click(screen.getByText('Book consultation'));
  await screen.findByRole('dialog');
  const button = screen.getByRole('button', { name: 'إغلاق' });
  expect(button).toBeInTheDocument();
  expect(screen.getByText('إغلاق')).toHaveClass('sr-only');
  });
  it('closes on overlay click', async () => {
  const user = userEvent.setup();
  themedRender(<ConsultDialog />);
  await user.click(screen.getByText('Book consultation'));
  await screen.findByRole('dialog');
  const overlay = document.body.querySelector('[data-slot="dialog-overlay"]');
  expect(overlay).not.toBeNull();
  await user.click(overlay as HTMLElement);
  await waitFor(() => {
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  });
  it('closes on close-button activation', async () => {
  const user = userEvent.setup();
  themedRender(<ConsultDialog />);
  await user.click(screen.getByText('Book consultation'));
  await screen.findByRole('dialog');
  await user.click(screen.getByRole('button', { name: 'Close' }));
  await waitFor(() => {
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  });
  it('has zero axe violations', async () => {
  const user = userEvent.setup();
  themedRender(<ConsultDialog />);
  await user.click(screen.getByText('Book consultation'));
  await screen.findByRole('dialog');
  await axePass(document.body);
  });
});
