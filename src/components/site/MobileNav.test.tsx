import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MobileNav } from '@/components/site/MobileNav';
import { NAV_ITEMS } from '@/constants/nav.constants';
import { axePass, enNavLabel, themedRender } from '@/test/utils';

function openPanel(user: ReturnType<typeof userEvent.setup>) {
  return user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
}

describe('MobileNav (trigger + sheet panel)', () => {
  it('renders only the 48px trigger with the menu.svg icon while closed', () => {
    const { container } = themedRender(<MobileNav />);

    const trigger = screen.getByRole('button', { name: 'Open navigation menu' });
    expect(trigger).toHaveClass('size-12');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // The trigger is the lucide `Menu` icon (three parallel lines) morphing
    // into a cross on open — asserted via `data-open`, not SVG geometry.
    const menuIcon = trigger.querySelector('svg');
    expect(menuIcon).toBeInTheDocument();
    expect(menuIcon).toHaveClass('lucide-menu');
    expect(menuIcon).toHaveAttribute('data-open', 'false');
    expect(container.querySelector('[data-slot="sheet-content"]')).toBeNull();
  });

  it('opens the panel with all 7 links plus the consultation CTA, aria-expanded true, and focus inside', async () => {
    const user = userEvent.setup();
    themedRender(<MobileNav />);

    const trigger = screen.getByRole('button', { name: 'Open navigation menu' });
    await openPanel(user);

    const dialog = await screen.findByRole('dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    expect(dialog).toHaveClass('end-0');
    await waitFor(() => {
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    });

    const panel = within(dialog);
    for (const item of NAV_ITEMS) {
      expect(panel.getByRole('link', { name: enNavLabel(item) })).toHaveAttribute(
        'href',
        item.href,
      );
    }
    expect(panel.getByRole('link', { name: /book free consultation/i })).toBeInTheDocument();
  });

  it('orders the panel rows by the catalog and closes on Escape with focus returned', async () => {
    const user = userEvent.setup();
    const { container } = themedRender(<MobileNav />);
    const trigger = screen.getByRole('button', { name: 'Open navigation menu' });

    await openPanel(user);
    const dialog = await screen.findByRole('dialog');

    const rows = Array.from(dialog.querySelectorAll('[data-slot="mobile-nav"] a'));
    expect(rows.map((row) => row.getAttribute('href'))).toEqual(
      NAV_ITEMS.map((item) => item.href),
    );

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(container).toContainElement(document.activeElement as HTMLElement);
    });
    expect(document.activeElement).toBe(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on overlay activation', async () => {
    const user = userEvent.setup();
    themedRender(<MobileNav />);
    await openPanel(user);
    await screen.findByRole('dialog');

    const overlay = document.body.querySelector('[data-slot="sheet-overlay"]');
    expect(overlay).not.toBeNull();
    await user.click(overlay as HTMLElement);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('morphs the mounted lucide Menu icon into the cross above the panel instead of any in-panel close', async () => {
    const user = userEvent.setup();
    const { container } = themedRender(<MobileNav />);
    await openPanel(user);
    const dialog = await screen.findByRole('dialog');

    expect(dialog.querySelector('[data-slot="sheet-close-button"]')).toBeNull();

    expect(dialog).toHaveClass('bg-linen', 'text-midnight-900', 'pt-16', 'lg:pt-20');

    expect(within(dialog).queryByRole('button', { name: /close navigation menu/i })).toBeNull();
    expect(within(dialog).getAllByRole('link')).toHaveLength(NAV_ITEMS.length + 1);

    const trigger = container.querySelector(
      '[data-slot="mobile-nav-trigger"]',
    ) as HTMLElement;
    expect(trigger).toHaveClass('pointer-events-auto');

    // The mounted lucide `Menu` icon carries the open flag: the CSS morph
    // (lines → cross) keys off `data-open`; jsdom has no Tailwind stylesheet,
    // so the transforms themselves live in the class strings, not inline
    // styles.
    const menuIcon = trigger.querySelector('svg');
    expect(menuIcon).toHaveClass('lucide-menu');
    expect(menuIcon).toHaveAttribute('data-open', 'true');
    expect(menuIcon).toHaveClass(
      'data-[open=true]:[&>path:nth-child(1)]:translate-y-[7px]',
      'data-[open=true]:[&>path:nth-child(3)]:-rotate-45',
    );

    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(document.activeElement).toBe(trigger);
  });

  it('closes the panel before navigating when a row is activated, firing exactly one close', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    themedRender(<MobileNav onOpenChange={onOpenChange} />);
    await openPanel(user);
    await screen.findByRole('dialog');

    await user.click(screen.getByRole('link', { name: 'Treatments' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    const closes = onOpenChange.mock.calls.filter(([open]) => !open);
    expect(closes).toHaveLength(1);
  });

  it('routes the CTA to the consultation anchor, closes first, and holds it in the sheet footer', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    themedRender(<MobileNav onOpenChange={onOpenChange} />);
    await openPanel(user);
    const dialog = await screen.findByRole('dialog');

    const cta = within(dialog).getByRole('link', { name: /book free consultation/i });
    expect(cta).toHaveAttribute('href', '#contact');
    expect(cta).toHaveClass('bg-primary');

    expect(dialog.querySelector('[data-slot="sheet-footer"]')).toHaveClass(
      '[&_[data-slot=button]]:w-full',
    );
    expect(dialog.querySelector('[data-slot="sheet-footer"]')).toContainElement(cta);

    await user.click(cta);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(onOpenChange.mock.calls.filter(([open]) => !open)).toHaveLength(1);
  });

  it('mirrors the desktop behavior: nothing active on `/` — the logo is the home link', () => {
    themedRender(<MobileNav defaultOpen />);

    const dialog = screen.getByRole('dialog');
    const panelRows = Array.from(dialog.querySelectorAll('[data-slot="mobile-nav"] a'));
    expect(panelRows).toHaveLength(NAV_ITEMS.length);
    for (const row of panelRows) {
      expect(row).not.toHaveAttribute('aria-current');
      expect(row).not.toHaveClass('text-primary');
    }
  });

  it('marks the active section row crimson via the shared matcher', () => {
    themedRender(<MobileNav activePath="/#treatments" defaultOpen />);

    const treatments = screen.getByRole('link', { name: 'Treatments' });
    expect(treatments).toHaveAttribute('aria-current', 'location');
    expect(treatments).toHaveClass('text-primary', 'dark:text-crimson-600');

    const faq = screen.getByRole('link', { name: 'FAQ' });
    expect(faq).not.toHaveClass('text-primary');
  });

  it('gives every row and the CTA >=48px targets with a focus ring', () => {
    themedRender(<MobileNav defaultOpen />);

    const dialog = screen.getByRole('dialog');
    const rows = Array.from(dialog.querySelectorAll('[data-slot="mobile-nav"] a'));
    expect(rows).toHaveLength(NAV_ITEMS.length);
    for (const row of rows) {
      expect(row).toHaveClass('min-h-12', 'focus-visible:ring-2', 'focus-visible:ring-ring');
    }

    expect(screen.getByRole('link', { name: /book free consultation/i })).toHaveClass(
      'min-h-12',
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
    );
  });

  it('renders the panel on the linen surface with midnight ink identical in both directions', () => {
    const ltr = themedRender(<MobileNav defaultOpen />, { dir: 'ltr', lang: 'en' });
    const ltrDialog = screen.getByRole('dialog');

    const ltrTrigger = ltr.container.querySelector('[data-slot="mobile-nav-trigger"]');
    ltr.unmount();

    const rtl = themedRender(<MobileNav defaultOpen />, { dir: 'rtl', lang: 'ar' });
    const rtlDialog = screen.getByRole('dialog');
    const rtlTrigger = rtl.container.querySelector('[data-slot="mobile-nav-trigger"]');

    expect(rtlDialog.className).toBe(ltrDialog.className);
    expect(rtlTrigger?.className).toBe(ltrTrigger?.className);
    expect(ltrDialog).toHaveClass('bg-linen', 'text-midnight-900', 'end-0');
    expect(rtlDialog).toHaveClass('bg-linen', 'text-midnight-900', 'end-0');
    expect(ltrTrigger).toHaveClass('text-midnight-900');
  });

  it('serves the Arabic catalog under locale=ar: row names inside the open sheet', () => {
    themedRender(<MobileNav defaultOpen />, { locale: 'ar' });

    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByRole('link', { name: 'العلاجات' })).toBeInTheDocument();
  });

  it('has zero axe violations with the panel open', async () => {
    themedRender(<MobileNav defaultOpen />);
    await screen.findByRole('dialog');
    await axePass(document.body);
  });
});
