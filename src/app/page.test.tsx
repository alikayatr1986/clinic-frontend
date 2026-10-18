import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';

import Home from '@/app/page';
import { NAV_ITEMS, SECTION_ITEMS } from '@/constants/nav.constants';
import { axePass, enNavLabel, themedRender } from '@/test/utils';

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>();
  const { installRouterSpies } = await import('@/test/utils');
  const spies = installRouterSpies();
  return {
    ...actual,
    useRouter: () => spies,
  };
});

describe('Home (/)', () => {
  it('renders the site header and the main landmark', () => {
    themedRender(<Home />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();

    expect(
      screen.getAllByRole('img', { name: 'Dr. Naser Dadaszade' }).length,
    ).toBeGreaterThan(0);
  });

  it('renders one landmark section per nav item, keyed by its anchor', () => {
    themedRender(<Home />);

    expect(SECTION_ITEMS).toHaveLength(NAV_ITEMS.length);

    for (const item of SECTION_ITEMS) {
      const region = screen.getByRole('region', { name: enNavLabel(item) });
      expect(region).toHaveAttribute('id', item.anchor);
      expect(region).toHaveClass('scroll-mt-16', 'lg:scroll-mt-20');
    }
  });

  it('points every anchored nav item at its own section id', () => {
    const anchored = NAV_ITEMS.filter((item) => item.anchor !== undefined);
    expect(anchored.length).toBeGreaterThan(0);

    for (const { anchor, href } of anchored) {
      expect(href).toBe(`#${anchor}`);
    }
  });

  it('reserves space for the fixed header via matching top padding', () => {
    themedRender(<Home />);

    expect(screen.getByRole('banner')).toHaveClass(
      'fixed',
      'inset-x-0',
      'top-0',
      'z-60',
      'h-16',
      'lg:h-20',
    );
    expect(screen.getByRole('main')).toHaveClass('pt-16', 'lg:pt-20');
  });

  it('serves the Arabic section labels under locale=ar: region name from ar.json', () => {
    themedRender(<Home />, { locale: 'ar' });

    expect(screen.getByRole('region', { name: 'العلاجات' })).toHaveAttribute(
      'id',
      'treatments',
    );
  });

  it('shows the desktop row with no active item on `/`', () => {
    const { container } = themedRender(<Home />);

    const row = container.querySelector('[data-slot="site-header-desktop"]');
    expect(row).toHaveClass('hidden', 'lg:flex');

    const current = container.querySelectorAll(
      '[data-slot="primary-nav"] a[aria-current]',
    );
    expect(current).toHaveLength(0);

    for (const item of NAV_ITEMS) {
      expect(screen.getByRole('link', { name: enNavLabel(item) })).toBeInTheDocument();
    }

    expect(screen.getByRole('link', { name: /book free consultation/i })).toHaveAttribute(
      'href',
      '#contact',
    );
  });

  it('shows the compact mobile row below `lg` (mark + wordmark, borderless pill, hamburger)', () => {
    const { container } = themedRender(<Home />);

    const mobileRow = container.querySelector('[data-slot="site-header-mobile"]');
    expect(mobileRow).not.toBeNull();
    const mobile = within(mobileRow as HTMLElement);

    expect(mobileRow).toHaveClass('flex', 'lg:hidden');

    expect(mobile.queryByText('Dr. Naser Dadaszade')).toBeNull();
    expect(mobile.getByRole('img', { name: 'Dr. Naser Dadaszade' })).toHaveClass('h-9');

    const pill = mobile.getByRole('button', { name: /change language/i });
    expect(pill).toHaveAttribute('data-variant', 'borderless');

    expect(mobile.getByRole('button', { name: 'Open navigation menu' })).toHaveClass('size-12');
  });

  it('carries no Next.js starter copy or assets', () => {
    const { container } = themedRender(<Home />);

    expect(screen.queryByText(/to get started/i)).toBeNull();
    expect(screen.queryByRole('link', { name: /deploy/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /documentation/i })).toBeNull();
    expect(screen.queryByAltText(/next\.js logo/i)).toBeNull();
    expect(screen.queryByAltText(/vercel logomark/i)).toBeNull();
    expect(container.querySelector('a[href*="vercel.com"]')).toBeNull();
  });

  it('keeps the shell structure and hues identical in RTL', () => {
    const ltr = themedRender(<Home />, { dir: 'ltr', lang: 'en' });
    const rtl = themedRender(<Home />, { dir: 'rtl', lang: 'ar' });

    const ltrHeader = ltr.container.querySelector('[data-slot="site-header"]');
    const rtlHeader = rtl.container.querySelector('[data-slot="site-header"]');

    expect(ltrHeader).not.toBeNull();
    expect(rtlHeader?.className).toBe(ltrHeader?.className);
    expect(ltrHeader).toHaveClass('bg-linen', 'text-midnight-900');
    expect(rtlHeader).toHaveClass('bg-linen', 'text-midnight-900');

    const ltrSections = ltr.container.querySelectorAll('main section');
    const rtlSections = rtl.container.querySelectorAll('main section');
    expect(rtlSections).toHaveLength(ltrSections.length);
    expect(rtlSections).toHaveLength(SECTION_ITEMS.length);
  });

  it('has zero axe violations', async () => {
    const { container } = themedRender(<Home />);
    await axePass(container);
  });
});
