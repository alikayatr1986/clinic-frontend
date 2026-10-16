import * as React from 'react';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LocalePill } from '@/components/site/LocalePill';
import { SiteHeader } from '@/components/site/SiteHeader';
import { NAV_ITEMS } from '@/constants/nav.constants';
import { axePass, themedRender } from '@/test/utils';

describe('SiteHeader (desktop row)', () => {
  it('renders the logo, every nav item, the EN pill, and the CTA', () => {
    const { container } = themedRender(<SiteHeader />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    const desktopRow = container.querySelector('[data-slot="site-header-desktop"]');
    expect(desktopRow).not.toBeNull();
    // Both row logos share the alt text, so the query is scoped by row slot.
    expect(
      within(desktopRow as HTMLElement).getByRole('img', { name: 'Dr. Naser Dadaszade' }),
    ).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(nav).toBeInTheDocument();
    expect(nav.querySelectorAll('a')).toHaveLength(NAV_ITEMS.length);

    for (const { label } of NAV_ITEMS) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }

    const desktop = within(desktopRow as HTMLElement);
    expect(
      desktop.getByRole('button', { name: /change language/i }),
    ).toBeInTheDocument();
    expect(
      desktop.getByRole('link', { name: /book free consultation/i }),
    ).toBeInTheDocument();
  });

  it('points every rendered nav link at its catalog href', () => {
    const { container } = themedRender(<SiteHeader />);

    const links = Array.from(
      container.querySelectorAll('[data-slot="primary-nav"] a'),
    );
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      NAV_ITEMS.map((item) => item.href),
    );
  });

  it('keeps the desktop row hidden below `lg` while the mobile row owns <1024px', () => {
    const { container } = themedRender(<SiteHeader />);

    const desktop = container.querySelector('[data-slot="site-header-desktop"]');
    expect(desktop).toHaveClass('hidden', 'lg:flex');

    const mobile = container.querySelector('[data-slot="site-header-mobile"]');
    expect(mobile).toHaveClass('flex', 'lg:hidden');
    // Renegotiation 2026-10-16: the mobile row carries only the face mark.
    expect(
      within(mobile as HTMLElement).queryByText('Dr. Naser Dadaszade'),
    ).toBeNull();
    expect(within(mobile as HTMLElement).getByRole('img', { name: 'Dr. Naser Dadaszade' })).toBeInTheDocument();
  });

  it('shows the derived mark in the mobile row, scoped by slot', () => {
    const { container } = themedRender(<SiteHeader />);

    const mobile = container.querySelector('[data-slot="site-header-mobile"]');
    expect(mobile).not.toBeNull();
    const row = within(mobile as HTMLElement);

    const logoLink = row.getByRole('link', { name: /Dr\. Naser Dadaszade/ });
    expect(logoLink).toHaveAttribute('href', '/');
    const mark = row.getByRole('img', { name: 'Dr. Naser Dadaszade' });
    expect(mark).toHaveClass('h-9', 'w-auto');
    // jsdom never fetches img src, so the asset reference and file existence
    // are asserted directly (src is emitted URL-encoded by next/image).
    expect(decodeURIComponent(mark.getAttribute('src') ?? '')).toContain(
      '/icons/mobile_logo.png',
    );
    expect(existsSync(join(process.cwd(), 'public', 'icons', 'mobile_logo.png'))).toBe(true);

    // Mark left, then the EN pill and the hamburger right.
    expect(row.getByRole('button', { name: /change language/i })).toHaveAttribute(
      'data-variant',
      'borderless',
    );
    expect(row.getByRole('button', { name: 'Open navigation menu' })).toHaveClass('size-12');
  });

  it('renders no active nav item on `/` — the logo is the home link', () => {
    const { container } = themedRender(<SiteHeader activePath="/" />);

    const navLinks = Array.from(
      container.querySelectorAll('[data-slot="primary-nav"] a'),
    );
    expect(navLinks).toHaveLength(NAV_ITEMS.length);
    for (const link of navLinks) {
      expect(link).not.toHaveAttribute('aria-current');
      expect(link).not.toHaveClass('text-primary');
      expect(link.querySelector('[data-slot="nav-underline"]')).toHaveClass(
        'border-transparent',
      );
    }
  });

  it('marks an anchored section active when activePath targets it, desktop and panel', async () => {
    const { container } = themedRender(
      <SiteHeader activePath="/#treatments" mobileNavDefaultOpen />,
    );

    // With the modal panel open, Radix aria-hides outside content, so the
    // desktop active state is asserted by attributes rather than by role.
    const desktopTreatments = container.querySelector(
      '[data-slot="primary-nav"] a[href="#treatments"]',
    );
    expect(desktopTreatments).not.toBeNull();
    expect(desktopTreatments).toHaveAttribute('aria-current', 'location');
    expect(desktopTreatments).toHaveClass('text-primary');

    const desktopFaq = container.querySelector(
      '[data-slot="primary-nav"] a[href="#faq"]',
    );
    expect(desktopFaq).not.toHaveClass('text-primary');

    // The mobile panel receives the same activePath via the shared matcher.
    await screen.findByRole('dialog');
    const panelTreatments = within(screen.getByRole('dialog')).getByRole(
      'link',
      { name: 'Treatments' },
    );
    expect(panelTreatments).toHaveAttribute('aria-current', 'location');
    expect(panelTreatments).toHaveClass('text-primary');
  });

  it('routes the CTA to the consultation anchor', () => {
    themedRender(<SiteHeader />);

    const cta = screen.getByRole('link', { name: /book free consultation/i });
    expect(cta).toHaveAttribute('href', '#contact');
    expect(cta).toHaveClass('bg-primary');
  });

  it('gives nav links, the EN pill, and the CTA >=48px targets and a focus ring', () => {
    const { container } = themedRender(<SiteHeader />);

    const desktopRow = container.querySelector('[data-slot="site-header-desktop"]');
    expect(desktopRow).not.toBeNull();

    const desktop = within(desktopRow as HTMLElement);

    const navLink = screen.getByRole('link', { name: 'Treatments' });
    expect(navLink).toHaveClass('min-h-12', 'focus-visible:ring-2', 'focus-visible:ring-ring');

    const pill = desktop.getByRole('button', { name: /change language/i });
    expect(pill).toHaveClass('h-12', 'focus-visible:ring-2', 'focus-visible:ring-ring');

    const cta = desktop.getByRole('link', { name: /book free consultation/i });
    expect(cta).toHaveClass('min-h-12', 'focus-visible:ring-2', 'focus-visible:ring-ring');
  });

  it('opens the supported-languages menu from the desktop pill without crashing', async () => {
    const user = userEvent.setup();
    const { container } = themedRender(<SiteHeader />);

    const desktopRow = container.querySelector('[data-slot="site-header-desktop"]');
    expect(desktopRow).not.toBeNull();

    const pill = within(desktopRow as HTMLElement).getByRole('button', {
      name: /change language/i,
    });
    await user.click(pill);

    const menu = await screen.findByRole('menu');
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(3);
    expect(within(menu).getByText('English')).toBeInTheDocument();
    expect(within(menu).getByText('العربية')).toBeInTheDocument();
    expect(within(menu).getByText('Русский')).toBeInTheDocument();

    // Default handler is the inert stub; activating an item must not throw.
    await user.keyboard('{Escape}');
  });

  it('exposes the locale-switch hook with the chosen locale', async () => {
    const user = userEvent.setup();
    const onLocaleChange = vi.fn();
    themedRender(<LocalePill locale="ar" onLocaleChange={onLocaleChange} />);

    await user.click(screen.getByRole('button', { name: /change language/i }));
    const menu = await screen.findByRole('menu');
    expect(menu.querySelector('[data-lang="ar"]')).toHaveAttribute('data-checked', 'true');

    await user.click(screen.getByRole('menuitem', { name: 'Русский' }));

    expect(onLocaleChange).toHaveBeenCalledTimes(1);
    expect(onLocaleChange).toHaveBeenCalledWith('ru');
  });

  it('mirrors the arrow icon in RTL without flipping hues', () => {
    const ltr = themedRender(<SiteHeader />, { dir: 'ltr', lang: 'en' });
    const ltrHeader = ltr.container.querySelector('[data-slot="site-header"]');
    const ltrCta = screen.getByRole('link', { name: /book free consultation/i });
    const ltrArrow = ltrCta.querySelector('svg');
    ltr.unmount();

    const rtl = themedRender(<SiteHeader />, { dir: 'rtl', lang: 'ar' });
    const rtlHeader = rtl.container.querySelector('[data-slot="site-header"]');
    const rtlCta = screen.getByRole('link', { name: /book free consultation/i });
    const rtlArrow = rtlCta.querySelector('svg');

    // Structure/hues are byte-for-byte identical; only the arrow mirrors.
    expect(rtlHeader?.className).toBe(ltrHeader?.className);
    expect(rtlCta).toHaveClass('bg-primary');
    expect(ltrCta).toHaveClass('bg-primary');
    expect(ltrArrow).toHaveClass('rtl:-scale-x-100');
    expect(rtlArrow).toHaveClass('rtl:-scale-x-100');
  });

  it('has zero axe violations', async () => {
    const { container } = themedRender(<SiteHeader />);
    await axePass(container);
  });
});

describe('SiteHeader (mobile row)', () => {
  it('keeps the desktop pill bordered and the mobile pill borderless', () => {
    const { container } = themedRender(<SiteHeader />);

    const desktopRow = container.querySelector('[data-slot="site-header-desktop"]');
    expect(desktopRow).not.toBeNull();

    const desktop = within(desktopRow as HTMLElement);
    const desktopPill = desktop.getByRole('button', { name: /change language/i });
    expect(desktopPill).toHaveClass('border', 'border-border');
    expect(desktopPill).toHaveAttribute('data-variant', 'bordered');

    const mobileRow = container.querySelector('[data-slot="site-header-mobile"]');
    expect(mobileRow).not.toBeNull();
    const mobile = within(mobileRow as HTMLElement);
    const mobilePill = mobile.getByRole('button', { name: /change language/i });
    expect(mobilePill).not.toHaveClass('border-border');
    expect(mobilePill).toHaveAttribute('data-variant', 'borderless');
  });

  it('opens the menu panel with the 7 nav links plus the consultation CTA from the hamburger', async () => {
    const user = userEvent.setup();
    themedRender(<SiteHeader />);

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    const dialog = await screen.findByRole('dialog');
    const panel = within(dialog);

    expect(dialog.querySelector('[data-slot="mobile-nav"]')).not.toBeNull();
    for (const { label, href } of NAV_ITEMS) {
      expect(panel.getByRole('link', { name: label })).toHaveAttribute('href', href);
    }
    expect(panel.getByRole('link', { name: /book free consultation/i })).toHaveAttribute(
      'href',
      '#contact',
    );

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Open navigation menu' })).toBe(
        document.activeElement,
      );
    });
  });

  it('has zero axe violations with the menu panel open', async () => {
    themedRender(<SiteHeader mobileNavDefaultOpen />);
    await screen.findByRole('dialog');
    await axePass(document.body);
  });
});
