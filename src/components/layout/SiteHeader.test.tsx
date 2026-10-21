import * as React from 'react';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LocalePill } from '@/components/layout/LocalePill';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { HEADER_NAV_ITEMS as NAV_ITEMS, HEADER_CTA_HREF } from '@/test/header.fixtures';
import {
  axePass,
  enNavLabel,
  nextRouterSpies,
  themedRender,
} from '@/test/utils';

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>();
  const { installRouterSpies } = await import('@/test/utils');

  const spies = installRouterSpies();
  return {
    ...actual,
    useRouter: () => spies,
  };
});

const router = nextRouterSpies();

afterEach(() => {
  vi.clearAllMocks();
});

function captureCookieWrites(): { written: string[]; restore: () => void } {
  let proto: object | null = Object.getPrototypeOf(document);
  while (proto && !Object.prototype.hasOwnProperty.call(proto, 'cookie')) {
    proto = Object.getPrototypeOf(proto);
  }
  const accessor = Object.getOwnPropertyDescriptor(proto!, 'cookie')!;
  const written: string[] = [];
  Object.defineProperty(document, 'cookie', {
    configurable: true,
    get() {
      return accessor.get!.call(document);
    },
    set(value: string) {
      written.push(String(value));
      accessor.set!.call(document, value);
    },
  });
  return {
    written,
    restore() {
      Reflect.deleteProperty(document, 'cookie');
    },
  };
}

describe('SiteHeader (desktop row)', () => {
  it('uses only caller-supplied links and forwards the same CTA to desktop and mobile', async () => {
    const user = userEvent.setup();
    const items = [
      { labelKey: 'blog', href: '/articles' },
      { labelKey: 'faq', href: '#help', anchor: 'help' },
    ] as const;
    const { container } = themedRender(
      <SiteHeader items={items} ctaHref="/consultation" activePath="/articles" />,
    );
    const desktopNav = container.querySelector('[data-slot="primary-nav"]') as HTMLElement;
    expect(within(desktopNav).getAllByRole('link').map(link => link.getAttribute('href'))).toEqual(
      ['/articles', '#help'],
    );
    expect(within(desktopNav).getByRole('link', { name: 'Blog' })).toHaveAttribute('aria-current', 'page');
    const desktop = container.querySelector('[data-slot="site-header-desktop"]') as HTMLElement;
    expect(within(desktop).getByRole('link', { name: /book free consultation/i })).toHaveAttribute('href', '/consultation');

    expect(within(desktopNav).queryByRole('link', { name: 'Treatments' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    const dialog = await screen.findByRole('dialog');
    const mobileNav = dialog.querySelector('[data-slot="mobile-nav"]') as HTMLElement;
    expect(within(mobileNav).getAllByRole('link').map(link => link.getAttribute('href'))).toEqual(
      ['/articles', '#help'],
    );
    expect(within(mobileNav).getByRole('link', { name: 'Blog' })).toHaveAttribute('aria-current');
    expect(within(dialog).getByRole('link', { name: /book free consultation/i })).toHaveAttribute('href', '/consultation');
    expect(within(mobileNav).queryByRole('link', { name: 'Treatments' })).toBeNull();
  });

  it('renders the logo, every nav item, the EN pill, and the CTA', () => {
    const { container } = themedRender(<SiteHeader items={NAV_ITEMS} ctaHref={HEADER_CTA_HREF} />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    const desktopRow = container.querySelector('[data-slot="site-header-desktop"]');
    expect(desktopRow).not.toBeNull();

    expect(
      within(desktopRow as HTMLElement).getByRole('img', { name: 'Dr. Naser Dadaszade' }),
    ).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(nav).toBeInTheDocument();
    expect(nav.querySelectorAll('a')).toHaveLength(NAV_ITEMS.length);

    for (const item of NAV_ITEMS) {
      expect(screen.getByRole('link', { name: enNavLabel(item) })).toBeInTheDocument();
    }

    const desktop = within(desktopRow as HTMLElement);
    expect(
      desktop.getByRole('button', { name: /change language/i }),
    ).toBeInTheDocument();
    expect(
      desktop.getByRole('link', { name: /book free consultation/i }),
    ).toBeInTheDocument();
  });

  it('starts transparent and adds a linen background after scrolling', async () => {
    const { container } = themedRender(<SiteHeader items={NAV_ITEMS} ctaHref={HEADER_CTA_HREF} />);
    const header = container.querySelector('[data-slot="site-header"]');
    expect(header).toHaveAttribute('data-scrolled', 'false');
    expect(header).toHaveClass('bg-transparent');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 24 });
    window.dispatchEvent(new Event('scroll'));
    await waitFor(() => expect(header).toHaveAttribute('data-scrolled', 'true'));
    expect(header).toHaveClass('bg-linen/95', 'backdrop-blur-sm');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    window.dispatchEvent(new Event('scroll'));
    await waitFor(() => expect(header).toHaveAttribute('data-scrolled', 'false'));
  });

  it('points every rendered nav link at its catalog href', () => {
    const { container } = themedRender(<SiteHeader items={NAV_ITEMS} ctaHref={HEADER_CTA_HREF} />);

    const links = Array.from(
      container.querySelectorAll('[data-slot="primary-nav"] a'),
    );
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      NAV_ITEMS.map((item) => item.href),
    );
  });

  it('keeps the desktop row hidden below `lg` while the mobile row owns <1024px', () => {
    const { container } = themedRender(<SiteHeader items={NAV_ITEMS} ctaHref={HEADER_CTA_HREF} />);

    const desktop = container.querySelector('[data-slot="site-header-desktop"]');
    expect(desktop).toHaveClass('hidden', 'lg:flex');

    const mobile = container.querySelector('[data-slot="site-header-mobile"]');
    expect(mobile).toHaveClass('flex', 'lg:hidden');

    expect(
      within(mobile as HTMLElement).queryByText('Dr. Naser Dadaszade'),
    ).toBeNull();
    expect(within(mobile as HTMLElement).getByRole('img', { name: 'Dr. Naser Dadaszade' })).toBeInTheDocument();
  });

  it('shows the derived mark in the mobile row, scoped by slot', () => {
    const { container } = themedRender(<SiteHeader items={NAV_ITEMS} ctaHref={HEADER_CTA_HREF} />);

    const mobile = container.querySelector('[data-slot="site-header-mobile"]');
    expect(mobile).not.toBeNull();
    const row = within(mobile as HTMLElement);

    const logoLink = row.getByRole('link', { name: /Dr\. Naser Dadaszade/ });
    expect(logoLink).toHaveAttribute('href', '/');
    const mark = row.getByRole('img', { name: 'Dr. Naser Dadaszade' });
    expect(mark).toHaveClass('h-9', 'w-auto');

    expect(decodeURIComponent(mark.getAttribute('src') ?? '')).toContain(
      '/icons/mobile_logo.png',
    );
    expect(existsSync(join(process.cwd(), 'public', 'icons', 'mobile_logo.png'))).toBe(true);

    expect(row.getByRole('button', { name: /change language/i })).toHaveAttribute(
      'data-variant',
      'borderless',
    );
    expect(row.getByRole('button', { name: 'Open navigation menu' })).toHaveClass('size-12');
  });

  it('renders no active nav item on `/` — the logo is the home link', () => {
    const { container } = themedRender(<SiteHeader items={NAV_ITEMS} ctaHref={HEADER_CTA_HREF} activePath="/" />);

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
      <SiteHeader items={NAV_ITEMS} ctaHref={HEADER_CTA_HREF} activePath="/#treatments" mobileNavDefaultOpen />,
    );

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

    await screen.findByRole('dialog');
    const panelTreatments = within(screen.getByRole('dialog')).getByRole(
      'link',
      { name: 'Treatments' },
    );
    expect(panelTreatments).toHaveAttribute('aria-current', 'location');
    expect(panelTreatments).toHaveClass('text-primary');
  });

  it('routes the CTA to the consultation anchor', () => {
    themedRender(<SiteHeader items={NAV_ITEMS} ctaHref={HEADER_CTA_HREF} />);

    const cta = screen.getByRole('link', { name: /book free consultation/i });
    expect(cta).toHaveAttribute('href', '#contact');
    expect(cta).toHaveClass('bg-primary');
  });

  it('gives nav links, the EN pill, and the CTA >=48px targets and a focus ring', () => {
    const { container } = themedRender(<SiteHeader items={NAV_ITEMS} ctaHref={HEADER_CTA_HREF} />);

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
    const { container } = themedRender(<SiteHeader items={NAV_ITEMS} ctaHref={HEADER_CTA_HREF} />);

    const desktopRow = container.querySelector('[data-slot="site-header-desktop"]');
    expect(desktopRow).not.toBeNull();

    const pill = within(desktopRow as HTMLElement).getByRole('button', {
      name: /change language/i,
    });
    await user.click(pill);

    const menu = await screen.findByRole('menu');
    const items = within(menu).getAllByRole('menuitem');
    expect(items).toHaveLength(2);
    expect(within(menu).getByText('English')).toBeInTheDocument();
    expect(within(menu).getByText('العربية')).toBeInTheDocument();
    expect(within(menu).queryByText('Русский')).toBeNull();
    expect(
      items.map((item) => item.getAttribute('data-lang')),
    ).toEqual(['en', 'ar']);

    expect(document.cookie).not.toContain('NEXT_LOCALE=');
    expect(router.refresh).not.toHaveBeenCalled();

    await user.keyboard('{Escape}');
  });

  it('shows ru in the menu automatically once it activates in routing.locales (Q2)', async () => {
    const user = userEvent.setup();

    vi.resetModules();
    vi.doMock('@/i18n/routing', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/i18n/routing')>();
      return {
        routing: {
          ...actual.routing,
          locales: ['en', 'ar', 'ru'],
        } as unknown as typeof actual.routing,
      };
    });
    try {
      const { LocalePill: RuLocalePill } = await import('@/components/layout/LocalePill');
      themedRender(<RuLocalePill />);

      await user.click(screen.getByRole('button', { name: /change language/i }));
      const menu = await screen.findByRole('menu');
      expect(within(menu).getAllByRole('menuitem')).toHaveLength(3);
      expect(within(menu).getByText('Русский')).toBeInTheDocument();
      expect(menu.querySelector('[data-lang="ru"]')).toBeInTheDocument();
    } finally {
      vi.doUnmock('@/i18n/routing');
      vi.resetModules();
    }
  });

  it('exposes the locale-switch hook with the chosen locale (optional override)', async () => {
    const user = userEvent.setup();
    const onLocaleChange = vi.fn();
    themedRender(<LocalePill locale="en" onLocaleChange={onLocaleChange} />);

    await user.click(screen.getByRole('button', { name: /change language/i }));
    const menu = await screen.findByRole('menu');
    expect(menu.querySelector('[data-lang="en"]')).toHaveAttribute('data-checked', 'true');

    await user.click(screen.getByRole('menuitem', { name: 'العربية' }));

    expect(onLocaleChange).toHaveBeenCalledTimes(1);
    expect(onLocaleChange).toHaveBeenCalledWith('ar');
    expect(document.cookie).not.toContain('NEXT_LOCALE=ar');
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it('switches locale for real: canonical cookie write + exactly one router.refresh (story 5)', async () => {
    const user = userEvent.setup();
    const { written, restore } = captureCookieWrites();
    try {
      themedRender(<LocalePill />);

      await user.click(screen.getByRole('button', { name: /change language/i }));
      await user.click(await screen.findByRole('menuitem', { name: 'العربية' }));

      expect(written).toEqual(['NEXT_LOCALE=ar; path=/; sameSite=lax; max-age=31536000']);
      expect(document.cookie).toContain('NEXT_LOCALE=ar');

      expect(router.refresh).toHaveBeenCalledTimes(1);
      expect(router.push).not.toHaveBeenCalled();
      expect(router.replace).not.toHaveBeenCalled();
      expect(router.back).not.toHaveBeenCalled();
      expect(router.forward).not.toHaveBeenCalled();
      expect(router.prefetch).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    } finally {
      restore();

      document.cookie = 'NEXT_LOCALE=; max-age=0; path=/';
    }
  });

  it('re-selecting the active locale is an idempotent no-op (story 5)', async () => {
    const user = userEvent.setup();
    const { written, restore } = captureCookieWrites();
    try {
      themedRender(<LocalePill locale="ar" />);

      await user.click(screen.getByRole('button', { name: /change language/i }));
      await user.click(await screen.findByRole('menuitem', { name: 'العربية' }));

      expect(written).toEqual([]);
      expect(document.cookie).not.toContain('NEXT_LOCALE=ar');
      expect(router.refresh).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    } finally {
      restore();
    }
  });

  it('keeps both laps of axe green for the pill-open menu', async () => {
    const user = userEvent.setup();

    const ltr = themedRender(<LocalePill />, { dir: 'ltr', lang: 'en' });
    await user.click(screen.getByRole('button', { name: /change language/i }));
    const ltrMenu = await screen.findByRole('menu');
    expect(ltrMenu.querySelector('[data-lang="en"]')).toHaveAttribute('data-checked', 'true');

    await axePass(ltrMenu);
    ltr.unmount();

    const rtl = themedRender(<LocalePill />, { dir: 'rtl', lang: 'ar', locale: 'ar' });
    await user.click(screen.getByRole('button', { name: /تغيير اللغة/ }));
    const rtlMenu = await screen.findByRole('menu');
    expect(rtlMenu.querySelector('[data-lang="ar"]')).toHaveAttribute('data-checked', 'true');
    expect(within(rtlMenu).getAllByRole('menuitem')).toHaveLength(2);
    await axePass(rtlMenu);
    rtl.unmount();
  });

  it('mirrors the arrow icon in RTL without flipping hues', () => {
    const ltr = themedRender(<SiteHeader items={NAV_ITEMS} ctaHref={HEADER_CTA_HREF} />, { dir: 'ltr', lang: 'en' });
    const ltrHeader = ltr.container.querySelector('[data-slot="site-header"]');
    const ltrCta = screen.getByRole('link', { name: /book free consultation/i });
    const ltrArrow = ltrCta.querySelector('svg');
    ltr.unmount();

    const rtl = themedRender(<SiteHeader items={NAV_ITEMS} ctaHref={HEADER_CTA_HREF} />, { dir: 'rtl', lang: 'ar' });
    const rtlHeader = rtl.container.querySelector('[data-slot="site-header"]');
    const rtlCta = screen.getByRole('link', { name: /book free consultation/i });
    const rtlArrow = rtlCta.querySelector('svg');

    expect(rtlHeader?.className).toBe(ltrHeader?.className);
    expect(rtlCta).toHaveClass('bg-primary');
    expect(ltrCta).toHaveClass('bg-primary');
    expect(ltrArrow).toHaveClass('rtl:-scale-x-100');
    expect(rtlArrow).toHaveClass('rtl:-scale-x-100');
  });

  it('serves the Arabic catalog under locale=ar: trigger, pill, nav row, CTA, alt (story 4 matrix)', () => {
    themedRender(<SiteHeader items={NAV_ITEMS} ctaHref={HEADER_CTA_HREF} />, { locale: 'ar' });
    expect(screen.getByRole('button', { name: 'فتح قائمة التنقل' })).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'تغيير اللغة، الحالية AR' })
    ).toHaveLength(2);

    expect(screen.getByRole('link', { name: 'العلاجات' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'احجز استشارتك مجانًا' })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: 'د. ناصر داداس زاده' })).toHaveLength(2);
  });

  it('has zero axe violations', async () => {
    const { container } = themedRender(<SiteHeader items={NAV_ITEMS} ctaHref={HEADER_CTA_HREF} />);
    await axePass(container);
  });
});

describe('SiteHeader (mobile row)', () => {
  it('keeps the desktop pill bordered and the mobile pill borderless', () => {
    const { container } = themedRender(<SiteHeader items={NAV_ITEMS} ctaHref={HEADER_CTA_HREF} />);

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
    themedRender(<SiteHeader items={NAV_ITEMS} ctaHref={HEADER_CTA_HREF} />);

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    const dialog = await screen.findByRole('dialog');
    const panel = within(dialog);

    expect(dialog.querySelector('[data-slot="mobile-nav"]')).not.toBeNull();
    for (const item of NAV_ITEMS) {
      expect(panel.getByRole('link', { name: enNavLabel(item) })).toHaveAttribute(
        'href',
        item.href,
      );
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
    themedRender(<SiteHeader items={NAV_ITEMS} ctaHref={HEADER_CTA_HREF} mobileNavDefaultOpen />);
    await screen.findByRole('dialog');
    await axePass(document.body);
  });
});
