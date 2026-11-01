import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';

import Home from '@/app/page';
import { NAV_ITEMS } from '@/features/landing/constants/nav.constants';
import { axePass, enNavLabel, themedRender } from '@/test/utils';
import arMessages from '../../messages/ar.json';
import enMessages from '../../messages/en.json';

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
  it('renders the site header, main, and footer landmarks in document order', () => {
    themedRender(<Home />);

    const banner = screen.getByRole('banner');
    const main = screen.getByRole('main');
    const contentinfo = screen.getByRole('contentinfo');

    expect(banner).toBeInTheDocument();
    expect(main).toBeInTheDocument();
    expect(contentinfo).toBeInTheDocument();
    expect(contentinfo).toHaveAttribute('data-slot', 'site-footer');

    // Sequential document order: banner before main, main before contentinfo
    expect(banner.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(main.compareDocumentPosition(contentinfo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(
      screen.getAllByRole('img', { name: 'Dr. Naser Dadaszade' }).length,
    ).toBeGreaterThan(0);
  });

  it('mounts the site footer after main with explore links, about section, and contact config', () => {
    themedRender(<Home />);
    const main = screen.getByRole('main');
    const footer = screen.getByRole('contentinfo');

    expect(main.nextElementSibling).toBe(footer);
    expect(footer).toHaveAttribute('data-slot', 'site-footer');

    // Verify Explore navigation targets within footer
    const galleryLinks = within(footer).getAllByRole('link', { name: enMessages.footer.exploreGallery });
    expect(galleryLinks[0]).toHaveAttribute('href', '/gallery');

    const blogLinks = within(footer).getAllByRole('link', { name: enMessages.footer.exploreBlog });
    expect(blogLinks[0]).toHaveAttribute('href', '/blog');

    const contactLinks = within(footer).getAllByRole('link', { name: enMessages.footer.exploreContact });
    expect(contactLinks[0]).toHaveAttribute('href', '#contact');

    // Verify address fallback in footer
    expect(within(footer).getAllByText(enMessages.footer.addressFallback).length).toBeGreaterThan(0);
  });

  it('renders one landmark section per nav item, keyed by its anchor', () => {
    themedRender(<Home />);

    for (const item of NAV_ITEMS) {
      const region = screen.getByRole('region', {
        name:
                  item.anchor === 'treatments'
                    ? enMessages.treatmentServices.heading
                    : item.anchor === 'blog'
                      ? enMessages.blogs.heading
                      : item.anchor === 'contact'
                        ? enMessages.contact.heading
                        : item.anchor === 'faq'
                          ? enMessages.faqSection.heading
                          : enNavLabel(item),
      });
      expect(region).toHaveAttribute('id', item.anchor);
      expect(region).toHaveClass('scroll-mt-16', 'lg:scroll-mt-20');
    }
  });

  it('places the single hero heading before the anchored sections', () => {
    const { container } = themedRender(<Home />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(container.querySelector('main')?.firstElementChild).toHaveAttribute('data-slot', 'hero');
    expect(screen.getByRole('link', { name: 'Book Free Video Consultation' })).toHaveAttribute('href', '#contact');
    expect(within(container.querySelector('[data-slot="hero"]') as HTMLElement).getByRole('link', { name: 'Explore Treatments' })).toHaveAttribute('href', '#treatments');
  });

  it('places one treatments region directly after Why Turkey with a live section heading', () => {
    const { container } = themedRender(<Home />);
    const treatments = screen.getByRole('region', { name: enMessages.treatmentServices.heading });
    expect(container.querySelectorAll('#treatments')).toHaveLength(1);
    expect(treatments.previousElementSibling).toHaveAttribute('id', 'why-turkey');
    expect(within(treatments).getByRole('heading', { level: 2 })).toHaveTextContent(enMessages.treatmentServices.heading);
  });

  it.each([
    ['en', enMessages],
    ['ar', arMessages],
  ] as const)('places FAQ after contact and links to it in %s', (locale, messages) => {
    const { container } = themedRender(<Home />, { locale });
    const faq = screen.getByRole('region', { name: messages.faqSection.heading });
    expect(container.querySelectorAll('#faq')).toHaveLength(1);
    expect(faq.previousElementSibling).toHaveAttribute('id', 'contact');
    expect(within(screen.getByRole('banner')).getByRole('link', { name: messages.nav.faq })).toHaveAttribute('href', '#faq');
    expect(within(faq).getByRole('link', { name: messages.header.cta })).toHaveAttribute('href', '#contact');
  });

  it('points every anchored nav item at its own section id', () => {
    const anchored = NAV_ITEMS.filter((item) => item.anchor !== undefined);
    expect(anchored.length).toBeGreaterThan(0);

    for (const { anchor, href } of anchored) {
      expect(href).toBe(`#${anchor}`);
    }
  });

  it('overlays the hero with a fixed transparent header', () => {
    themedRender(<Home />);

    expect(screen.getByRole('banner')).toHaveClass(
      'fixed',
      'inset-x-0',
      'top-0',
      'z-60',
      'h-16',
      'lg:h-20',
    );
    expect(screen.getByRole('main')).not.toHaveClass('pt-16', 'lg:pt-20');
    expect(screen.getByRole('banner')).toHaveAttribute('data-scrolled', 'false');
    expect(screen.getByRole('banner')).toHaveClass('bg-transparent');
  });

  it('serves the Arabic section labels under locale=ar: region name from ar.json', () => {
    themedRender(<Home />, { locale: 'ar' });

    expect(screen.getByRole('region', { name: arMessages.treatmentServices.heading })).toHaveAttribute(
      'id',
      'treatments',
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(arMessages.hero.heading);
    expect(screen.getByRole('region', { name: arMessages.hero.heading })).toHaveAttribute('dir', 'rtl');
  });

  it('shows the desktop row with no active item on `/`', () => {
    const { container } = themedRender(<Home />);

    const row = container.querySelector('[data-slot="site-header-desktop"]');
    expect(row).toHaveClass('hidden', 'lg:flex');

    const primaryNav = container.querySelector('[data-slot="primary-nav"]') as HTMLElement;
    expect(primaryNav).not.toBeNull();

    const current = container.querySelectorAll(
      '[data-slot="primary-nav"] a[aria-current]',
    );
    expect(current).toHaveLength(0);

    for (const item of NAV_ITEMS) {
      expect(within(primaryNav).getByRole('link', { name: enNavLabel(item) })).toBeInTheDocument();
    }

    expect(screen.getAllByRole('link', { name: /book free consultation/i })[0]).toHaveAttribute(
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

    expect(mobile.getByRole('button', { name: 'Open navigation menu' })).toBeInTheDocument();
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
    expect(ltrHeader).toHaveClass('bg-transparent', 'text-midnight-900');
    expect(rtlHeader).toHaveClass('bg-transparent', 'text-midnight-900');

    const ltrSections = ltr.container.querySelectorAll('main section[id]');
    const rtlSections = rtl.container.querySelectorAll('main section[id]');
    expect(rtlSections).toHaveLength(ltrSections.length);
    expect(rtlSections).toHaveLength(6);
  });

  it('has zero axe violations in LTR', async () => {
    const { container } = themedRender(<Home />, { dir: 'ltr', lang: 'en', locale: 'en' });
    await axePass(container);
  }, 15000);

  it('has zero axe violations in RTL', async () => {
    const { container } = themedRender(<Home />, { dir: 'rtl', lang: 'ar', locale: 'ar' });
    await axePass(container);
  }, 15000);
});
