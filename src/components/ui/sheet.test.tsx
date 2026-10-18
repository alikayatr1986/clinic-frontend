import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger, } from '@/components/ui/sheet';
import { axePass, themedRender } from '@/test/utils';
function NavSheet({ side = 'right', }: {
  side?: 'top' | 'bottom' | 'left' | 'right' | 'start' | 'end';
}) {
  return (<Sheet>
  <SheetTrigger>Open menu</SheetTrigger>
  <SheetContent side={side}>
  <SheetTitle>Menu</SheetTitle>
  <SheetDescription>Site navigation</SheetDescription>
  <nav>
  <a href="/treatments">Treatments</a>
  </nav>
  </SheetContent>
  </Sheet>);
}
describe('Sheet', () => {
  it('renders smoke with a trigger', () => {
  themedRender(<NavSheet />);
  expect(screen.getByText('Open menu')).toBeInTheDocument();
  });
  it('applies one directional class per side variant', async () => {
  const user = userEvent.setup();
  const sides = [
  ['right', 'slide-in-from-right'],
  ['left', 'slide-in-from-left'],
  ['top', 'slide-in-from-top'],
  ['bottom', 'slide-in-from-bottom'],
  ['start', 'slide-in-from-start'],
  ['end', 'slide-in-from-end'],
  ] as const;
  for (const [side, slideClass] of sides) {
  const { unmount } = themedRender(<NavSheet side={side}/>);
  await user.click(screen.getByText('Open menu'));
  const dialog = await screen.findByRole('dialog');
  expect(dialog.className).toContain(slideClass);
  await user.keyboard('{Escape}');
  await waitFor(() => {
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  unmount();
  }
  });
  it('anchors logical side variants to the flow edges', async () => {
  const user = userEvent.setup();
  const start = themedRender(<NavSheet side="start"/>);
  await user.click(screen.getByText('Open menu'));
  const startDialog = await screen.findByRole('dialog');
  expect(startDialog).toHaveClass('start-0', 'border-e');
  expect(startDialog.className).toContain('slide-in-from-start');
  await user.keyboard('{Escape}');
  await waitFor(() => {
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  start.unmount();
  themedRender(<NavSheet side="end"/>);
  await user.click(screen.getByText('Open menu'));
  const endDialog = await screen.findByRole('dialog');
  expect(endDialog).toHaveClass('end-0', 'border-s');
  expect(endDialog.className).toContain('slide-in-from-end');
  });
  it('carries the semantic overlay class when open', async () => {
  const user = userEvent.setup();
  themedRender(<NavSheet />);
  await user.click(screen.getByText('Open menu'));
  await screen.findByRole('dialog');
  const overlay = document.body.querySelector('[data-slot="sheet-overlay"]');
  expect(overlay?.className).toContain('bg-midnight-950/60');
  });
  it('moves focus into the sheet and closes on Escape', async () => {
  const user = userEvent.setup();
  themedRender(<NavSheet />);
  await user.click(screen.getByText('Open menu'));
  const dialog = await screen.findByRole('dialog');
  await waitFor(() => {
  expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });
  await user.keyboard('{Escape}');
  await waitFor(() => {
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  });
  it('keeps text and surface classes identical in RTL', async () => {
  const user = userEvent.setup();
  const rtl = themedRender(<Sheet>
  <SheetTrigger>افتح القائمة</SheetTrigger>
  <SheetContent side="end">
  <SheetTitle>القائمة</SheetTitle>
  <SheetDescription>تصفح الموقع</SheetDescription>
  </SheetContent>
  </Sheet>, { dir: 'rtl', lang: 'ar' });
  expect(rtl.container.firstElementChild).toHaveAttribute('dir', 'rtl');
  expect(rtl.container.firstElementChild).toHaveAttribute('lang', 'ar');
  await user.click(screen.getByText('افتح القائمة'));
  const dialog = await screen.findByRole('dialog');
  expect(dialog.className).toContain('bg-background');
  expect(screen.getByText('القائمة')).toBeInTheDocument();
  });
  it('localizes the Close surfaces from the Arabic catalog (story 4 matrix)', async () => {
  const user = userEvent.setup();
  themedRender(<NavSheet />, { locale: 'ar' });
  await user.click(screen.getByText('Open menu'));
  await screen.findByRole('dialog');
  expect(screen.getByRole('button', { name: 'إغلاق' })).toBeInTheDocument();
  expect(screen.getByText('إغلاق')).toHaveClass('sr-only');
  });
  it('closes on overlay click', async () => {
  const user = userEvent.setup();
  themedRender(<NavSheet />);
  await user.click(screen.getByText('Open menu'));
  await screen.findByRole('dialog');
  const overlay = document.body.querySelector('[data-slot="sheet-overlay"]');
  expect(overlay).not.toBeNull();
  await user.click(overlay as HTMLElement);
  await waitFor(() => {
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  });
  it('closes on close-button activation', async () => {
  const user = userEvent.setup();
  themedRender(<NavSheet />);
  await user.click(screen.getByText('Open menu'));
  await screen.findByRole('dialog');
  await user.click(screen.getByRole('button', { name: 'Close' }));
  await waitFor(() => {
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  });
  it('has zero axe violations', async () => {
  const user = userEvent.setup();
  themedRender(<NavSheet />);
  await user.click(screen.getByText('Open menu'));
  await screen.findByRole('dialog');
  await axePass(document.body);
  });
});
