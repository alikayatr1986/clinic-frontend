import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";

import { SiteFooter } from "./SiteFooter";
import type { SiteFooterConfig } from "@/features/footer/types/footer.types";
import { axePass, themedRender } from "@/test/utils";

vi.mock("../assets/icons/footer-logo-white.png", () => ({
  default: {
    src: "/_next/static/media/footer-logo-white.test.png",
    width: 1280,
    height: 326,
  },
}));

vi.mock("../assets/icons/whatsapp-icon.png", () => ({
  default: {
    src: "/_next/static/media/whatsapp-icon.test.png",
    width: 512,
    height: 512,
  },
}));

vi.mock("../assets/icons/telegram-icon.png", () => ({
  default: {
    src: "/_next/static/media/telegram-icon.test.png",
    width: 512,
    height: 512,
  },
}));

vi.mock("../assets/images/istanbul-skyline-with-galata-tower-image.png", () => ({
  default: {
    src: "/_next/static/media/istanbul-skyline-with-galata-tower-image.test.png",
    width: 2172,
    height: 724,
  },
}));

const FULL_CONFIG: SiteFooterConfig = {
  phone: "+905551234567",
  email: "clinic@example.test",
  address: {
    en: "Nişantaşı, Istanbul, Türkiye",
    ar: "نيشانتاشي، إسطنبول، تركيا",
  },
  instagram: "https://www.instagram.com/naser.dadaszade.md/",
  whatsapp: "https://wa.me/905551234567",
  telegram: "https://t.me/exampleclinic",
};

describe("SiteFooter", () => {
  it("renders the four desktop columns in order with 48px gap and logical rules", () => {
    const { container } = themedRender(<SiteFooter config={FULL_CONFIG} />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();

    const grid = container.querySelector('[data-slot="site-footer-grid"]');
    expect(grid).not.toBeNull();
    expect(
      Array.from(grid!.children).map((column) => column.getAttribute("data-slot")),
    ).toEqual([
      "footer-brand",
      "footer-explore",
      "footer-about",
      "footer-contact",
    ]);
    expect(grid).toHaveClass(
      "hidden",
      "lg:grid",
      "lg:grid-cols-[2fr_1fr_1fr_1.4fr]",
      "lg:gap-12",
    );

    for (const slot of ["footer-explore", "footer-about", "footer-contact"]) {
      const column = container.querySelector(`[data-slot="${slot}"]`);
      expect(column).toHaveClass("lg:border-s", "lg:border-white/10", "lg:ps-4");
    }

    expect(screen.queryByRole("heading", { name: /treatments/i })).toBeNull();
    expect(screen.queryByText(/treatments/i)).toBeNull();
  });

  it("applies the dual-variant display strategy so exactly one composition exposes content", () => {
    const { container } = themedRender(<SiteFooter config={FULL_CONFIG} />);

    const desktop = container.querySelector('[data-slot="site-footer-grid"]');
    const mobile = container.querySelector('[data-slot="site-footer-mobile"]');

    expect(desktop).not.toBeNull();
    expect(mobile).not.toBeNull();

    expect(desktop).toHaveClass("hidden", "lg:grid");
    expect(mobile).toHaveClass("lg:hidden");
  });

  it("renders three group headings with crimson rules and the brand rule on desktop", () => {
    const { container } = themedRender(<SiteFooter config={FULL_CONFIG} />);

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      "Explore",
      "About",
      "Get in Touch",
    ]);

    for (const heading of headings) {
      const rule = heading.parentElement?.querySelector(
        'span[aria-hidden="true"]',
      );
      expect(rule).toHaveClass("mt-3", "mb-6", "h-1", "w-14", "bg-crimson-600");
    }

    const brand = container.querySelector('[data-slot="footer-brand"]');
    expect(brand?.querySelector('span[aria-hidden="true"]')).toHaveClass(
      "h-1",
      "w-[72px]",
      "bg-crimson-600",
    );
    expect(within(brand as HTMLElement).getByRole("img")).toHaveClass(
      "h-16",
      "w-auto",
    );
    expect(
      within(brand as HTMLElement).getByRole("link", {
        name: "Dr. Naser Dadaszade",
      }),
    ).toHaveAttribute("href", "/");
  });

  it("points Explore at real destinations and Contact at the landing form in both layouts", () => {
    const { container } = themedRender(<SiteFooter config={FULL_CONFIG} />);

    const desktopExplore = container.querySelector(
      '[data-slot="footer-explore"]',
    ) as HTMLElement;
    expect(
      within(desktopExplore).getByRole("link", {
        name: "Gallery",
      }),
    ).toHaveAttribute("href", "/gallery");
    expect(
      within(desktopExplore).getByRole("link", { name: "Blog" }),
    ).toHaveAttribute("href", "/blog");
    expect(
      within(desktopExplore).getByRole("link", { name: "Contact" }),
    ).toHaveAttribute("href", "#contact");

    const mobileExplore = container.querySelector(
      '[data-slot="footer-panel-explore"]',
    ) as HTMLElement;
    expect(
      within(mobileExplore).getByRole("link", {
        name: "Gallery",
      }),
    ).toHaveAttribute("href", "/gallery");
    expect(
      within(mobileExplore).getByRole("link", { name: "Blog" }),
    ).toHaveAttribute("href", "/blog");
    expect(
      within(mobileExplore).getByRole("link", { name: "Contact" }),
    ).toHaveAttribute("href", "#contact");
  });

  it("links About items to landing sections and keeps legal labels non-interactive", () => {
    const { container } = themedRender(<SiteFooter config={FULL_CONFIG} />);
    for (const selector of ['[data-slot="footer-about"]', '[data-slot="footer-panel-about"]']) {
      const about = container.querySelector(selector) as HTMLElement;
      for (const [label, href] of [["Meet the Surgeon", "/#contact"], ["FAQ", "/#faq"]]) {
        expect(within(about).getByRole("link", { name: label, hidden: true })).toHaveAttribute("href", href);
      }
      expect(within(about).queryByText("Coming Soon")).toBeNull();
    }

    const legal = screen.getByRole("list", { name: "Legal" });
    expect(within(legal).getAllByRole("listitem")).toHaveLength(3);
    for (const label of ["Privacy Policy", "Terms of Use", "Legal Notice"]) {
      expect(within(legal).getByText(label)).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: label })).toBeNull();
    }
  });

  it("uses tel/mailto links and safe new-tab channel links with an SR hint", () => {
    const { container } = themedRender(<SiteFooter config={FULL_CONFIG} />);

    const desktopContact = container.querySelector(
      '[data-slot="footer-contact"]',
    ) as HTMLElement;
    expect(
      desktopContact.querySelector('a[href="tel:+905551234567"]'),
    ).not.toBeNull();
    expect(
      desktopContact.querySelector('a[href="mailto:clinic@example.test"]'),
    ).not.toBeNull();

    const whatsapp = within(desktopContact).getByRole("link", {
      name: /whatsapp/i,
    });
    expect(whatsapp).toHaveAttribute("href", "https://wa.me/905551234567");
    expect(whatsapp).toHaveAttribute("target", "_blank");
    expect(whatsapp).toHaveAttribute("rel", "noopener noreferrer");
    expect(within(whatsapp).getByText("opens in a new tab")).toHaveClass(
      "sr-only",
    );

    const telegram = within(desktopContact).getByRole("link", {
      name: /telegram/i,
    });
    expect(telegram).toHaveAttribute("href", "https://t.me/exampleclinic");
    expect(telegram).toHaveAttribute("target", "_blank");
    expect(telegram).toHaveAttribute("rel", "noopener noreferrer");
    expect(within(telegram).getByText("opens in a new tab")).toHaveClass(
      "sr-only",
    );

    const mobileContact = container.querySelector(
      '[data-slot="footer-panel-contact"]',
    ) as HTMLElement;
    expect(
      mobileContact.querySelector('a[href="tel:+905551234567"]'),
    ).not.toBeNull();
    expect(
      mobileContact.querySelector('a[href="mailto:clinic@example.test"]'),
    ).not.toBeNull();
    for (const contact of [desktopContact, mobileContact]) {
      expect(within(contact).getByRole("link", { name: /instagram/i })).toHaveAttribute(
        "href", "https://www.instagram.com/naser.dadaszade.md/",
      );
    }
    const mobileWhatsapp = within(mobileContact).getByRole("link", {
      name: /whatsapp/i,
    });
    expect(mobileWhatsapp).toHaveAttribute("href", "https://wa.me/905551234567");
    expect(mobileWhatsapp).toHaveAttribute("target", "_blank");
    expect(mobileWhatsapp).toHaveAttribute("rel", "noopener noreferrer");
    expect(within(mobileWhatsapp).getByText("opens in a new tab")).toHaveClass(
      "sr-only",
    );

    const mobileTelegram = within(mobileContact).getByRole("link", {
      name: /telegram/i,
    });
    expect(mobileTelegram).toHaveAttribute("href", "https://t.me/exampleclinic");
    expect(mobileTelegram).toHaveAttribute("target", "_blank");
    expect(mobileTelegram).toHaveAttribute("rel", "noopener noreferrer");
    expect(within(mobileTelegram).getByText("opens in a new tab")).toHaveClass(
      "sr-only",
    );
  });

  it("links to configured Instagram in both contact layouts", () => {
    const { container } = themedRender(<SiteFooter config={{ instagram: "https://www.instagram.com/naser.dadaszade.md/" }} />);
    for (const slot of ["footer-contact", "footer-panel-contact"]) {
      const section = container.querySelector(`[data-slot="${slot}"]`) as HTMLElement;
      const link = within(section).getByRole("link", { name: /instagram/i });
      expect(link).toHaveAttribute("href", "https://www.instagram.com/naser.dadaszade.md/");
      expect(link.querySelector("img")).toHaveAttribute("src", expect.stringContaining("instagram-icon"));
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(within(link).getByText("opens in a new tab")).toHaveClass("sr-only");
    }
  });

  it("renders exactly three mobile disclosure rows in order with contact open by default", () => {
    const { container } = themedRender(<SiteFooter config={FULL_CONFIG} />);

    const mobile = container.querySelector(
      '[data-slot="site-footer-mobile"]',
    ) as HTMLElement;
    expect(mobile).not.toBeNull();

    const disclosures = mobile.querySelectorAll("details");
    expect(disclosures).toHaveLength(3);

    const explore = disclosures[0];
    const about = disclosures[1];
    const contact = disclosures[2];

    expect(explore).toHaveAttribute("data-slot", "footer-disclosure-explore");
    expect(explore).not.toHaveAttribute("open");

    expect(about).toHaveAttribute("data-slot", "footer-disclosure-about");
    expect(about).not.toHaveAttribute("open");

    expect(contact).toHaveAttribute("data-slot", "footer-disclosure-contact");
    expect(contact).toHaveAttribute("open");

    const summaries = mobile.querySelectorAll("summary");
    expect(summaries).toHaveLength(3);
    expect(summaries[0].textContent).toContain("Explore");
    expect(summaries[1].textContent).toContain("About");
    expect(summaries[2].textContent).toContain("Get in Touch");

    for (const summary of summaries) {
      expect(summary).toHaveClass("min-h-16", "border-y", "border-white/10");
    }

    expect(
      mobile.querySelector(
        '[data-slot="footer-summary-explore"] svg.lucide-images',
      ),
    ).toBeInTheDocument();
    expect(
      mobile.querySelector(
        '[data-slot="footer-summary-about"] svg.lucide-user',
      ),
    ).toBeInTheDocument();
    expect(
      mobile.querySelector(
        '[data-slot="footer-summary-contact"] svg.lucide-phone',
      ),
    ).toBeInTheDocument();
  });

  it("applies rotation mirroring and reduced-motion classes to mobile disclosure chevrons", () => {
    const { container } = themedRender(<SiteFooter config={FULL_CONFIG} />);

    const mobile = container.querySelector(
      '[data-slot="site-footer-mobile"]',
    ) as HTMLElement;
    const chevrons = mobile.querySelectorAll("summary svg.lucide-chevron-down");
    expect(chevrons).toHaveLength(3);

    for (const chevron of chevrons) {
      expect(chevron).toHaveClass(
        "group-open:rotate-180",
        "rtl:-rotate-90",
        "rtl:group-open:rotate-90",
        "motion-reduce:transition-none",
      );
    }
  });

  it("renders 40px icon tiles and 2-column channel grid at >=360px on mobile", () => {
    const { container } = themedRender(<SiteFooter config={FULL_CONFIG} />);

    const mobileContact = container.querySelector(
      '[data-slot="footer-panel-contact"]',
    ) as HTMLElement;
    expect(mobileContact).not.toBeNull();

    const tiles = mobileContact.querySelectorAll("span.size-10.rounded-lg.bg-white\\/5");
    expect(tiles.length).toBeGreaterThanOrEqual(3);

    const channelGrid = mobileContact.querySelector(
      "div.grid.grid-cols-1.min-\\[360px\\]\\:grid-cols-2",
    );
    expect(channelGrid).not.toBeNull();
    expect(channelGrid).toHaveClass("max-w-[528px]", "gap-3");
  });

  it("renders the decorative band with skyline and crimson arc glow hidden from accessibility", () => {
    const { container } = themedRender(<SiteFooter config={FULL_CONFIG} />);

    const glow = container.querySelector('[data-slot="footer-arc-glow"]');
    expect(glow).not.toBeNull();
    expect(glow).toHaveAttribute("aria-hidden", "true");
    expect(glow).toHaveClass("pointer-events-none");
    expect(glow?.className).toContain(
      "bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--color-crimson-600)_35%,transparent)_0%,transparent_70%)]",
    );

    const skyline = container.querySelector('[data-slot="footer-skyline"]');
    expect(skyline).not.toBeNull();
    expect(skyline).toHaveAttribute("aria-hidden", "true");
    expect(skyline).toHaveClass(
      "pointer-events-none",
      "opacity-35",
      "bottom-[calc(100%-1.5rem)]",
      "w-screen",
      "lg:opacity-10",
    );

    const skylineImg = skyline?.querySelector("img");
    expect(skyline?.parentElement).toHaveAttribute("data-slot", "footer-bottom");
    expect(skylineImg).not.toBeNull();
    expect(skylineImg).toHaveClass("h-auto", "w-full");
    expect(skylineImg).toHaveAttribute("aria-hidden", "true");
    expect(skylineImg).toHaveAttribute("alt", "");
    expect(skylineImg).toHaveAttribute("sizes", "100vw");
    expect(skylineImg).toHaveAttribute("width", "2172");
    expect(skylineImg).toHaveAttribute("height", "724");
  });

  it("omits missing contact rows and channels without placeholders in both layouts", () => {
    const { container } = themedRender(<SiteFooter config={{}} />);

    expect(container.querySelector('a[href^="tel:"]')).toBeNull();
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(screen.queryByRole("link", { name: /instagram/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /whatsapp/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /telegram/i })).toBeNull();
    expect(screen.queryByText(/XXX/)).toBeNull();

    const desktopContact = container.querySelector(
      '[data-slot="footer-contact"]',
    ) as HTMLElement;
    expect(within(desktopContact).getAllByRole("listitem")).toHaveLength(1);
    expect(within(desktopContact).getByText("Istanbul, Turkey")).toBeInTheDocument();
    expect(
      within(desktopContact).getByText("(Address details to be provided)"),
    ).toBeInTheDocument();

    const mobileContact = container.querySelector(
      '[data-slot="footer-panel-contact"]',
    ) as HTMLElement;
    expect(within(mobileContact).getAllByRole("listitem")).toHaveLength(1);
    expect(within(mobileContact).getByText("Istanbul, Turkey")).toBeInTheDocument();
    expect(
      within(mobileContact).getByText("(Address details to be provided)"),
    ).toBeInTheDocument();
  });

  it("treats whitespace-only configuration as missing", () => {
    const { container } = themedRender(
      <SiteFooter
        config={{
          phone: "  ",
          email: " ",
          whatsapp: " ",
          telegram: "\t",
          address: { en: " ", ar: "" },
        }}
      />,
    );

    expect(container.querySelector('a[href^="tel:"]')).toBeNull();
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(screen.queryByRole("link", { name: /instagram/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /whatsapp/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /telegram/i })).toBeNull();

    const fallbacks = screen.getAllByText("Istanbul, Turkey");
    expect(fallbacks).toHaveLength(2);
    const notes = screen.getAllByText("(Address details to be provided)");
    expect(notes).toHaveLength(2);
  });

  it("uses the available locale when only one address locale is configured", () => {
    themedRender(
      <SiteFooter config={{ address: { en: FULL_CONFIG.address!.en!, ar: "" } }} />,
    );

    const addresses = screen.getAllByText("Nişantaşı, Istanbul, Türkiye");
    expect(addresses).toHaveLength(2);
    expect(screen.queryByText("Istanbul, Turkey")).toBeNull();
  });

  it("shows the localized configured address instead of the fallback", () => {
    const english = themedRender(<SiteFooter config={FULL_CONFIG} />);
    const enAddresses = screen.getAllByText("Nişantaşı, Istanbul, Türkiye");
    expect(enAddresses).toHaveLength(2);
    expect(screen.queryByText("Istanbul, Turkey")).toBeNull();
    english.unmount();

    themedRender(<SiteFooter config={FULL_CONFIG} />, { locale: "ar" });
    const arAddresses = screen.getAllByText("نيشانتاشي، إسطنبول، تركيا");
    expect(arAddresses).toHaveLength(2);
    expect(screen.queryByText("إسطنبول، تركيا")).toBeNull();
  });

  it("computes the copyright year at render", () => {
    themedRender(<SiteFooter config={FULL_CONFIG} />);

    expect(
      screen.getByText(
        `© ${new Date().getFullYear()} Dr. Naser Dadaszade. All rights reserved.`,
      ),
    ).toBeInTheDocument();
  });

  it("keeps every interactive element focus-visible and static labels out of tab order", () => {
    const { container } = themedRender(<SiteFooter config={FULL_CONFIG} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(22);
    for (const link of links) {
      expect(link).toHaveClass(
        "focus-visible:ring-2",
        "focus-visible:ring-ring",
      );
    }

    const summaries = container.querySelectorAll("summary");
    expect(summaries).toHaveLength(3);
    for (const summary of summaries) {
      expect(summary).toHaveClass(
        "focus-visible:ring-2",
        "focus-visible:ring-ring",
      );
    }

    for (const badge of screen.queryAllByText("Coming Soon")) {
      expect(badge.closest("a")).toBeNull();
      expect(badge).not.toHaveAttribute("tabindex");
    }
    for (const label of ["Privacy Policy", "Terms of Use", "Legal Notice"]) {
      expect(screen.getByText(label).closest("a")).toBeNull();
    }
  });

  it("mirrors the grid, rules, chevrons, and arrows for RTL without flipping the dark hues", () => {
    const ltr = themedRender(<SiteFooter config={FULL_CONFIG} />, {
      dir: "ltr",
      lang: "en",
    });
    const ltrFooter = screen.getByRole("contentinfo");
    const ltrFooterClass = ltrFooter.className;
    const ltrGridClass = ltrFooter.querySelector(
      '[data-slot="site-footer-grid"]',
    )?.className;
    ltr.unmount();

    const { container } = themedRender(<SiteFooter config={FULL_CONFIG} />, {
      dir: "rtl",
      lang: "ar",
      locale: "ar",
    });

    const rtlFooter = screen.getByRole("contentinfo");
    expect(rtlFooter.className).toBe(ltrFooterClass);
    expect(rtlFooter).toHaveClass("bg-midnight-950");
    expect(
      rtlFooter.querySelector('[data-slot="site-footer-grid"]')?.className,
    ).toBe(ltrGridClass);

    expect(
      screen.getByRole("heading", { name: "استكشف" }),
    ).toBeInTheDocument();
    expect(
      rtlFooter.querySelector('[data-slot="footer-explore"] svg'),
    ).toHaveClass("rtl:rotate-90");
    expect(
      rtlFooter.querySelector(
        '[data-slot="footer-contact"] a[target="_blank"] svg',
      ),
    ).toHaveClass("rtl:-scale-x-100");

    const mobileSummaries = container.querySelectorAll("summary");
    expect(mobileSummaries[0].textContent).toContain("استكشف");
    expect(mobileSummaries[1].textContent).toContain("نبذة");
    expect(mobileSummaries[2].textContent).toContain("تواصل معنا");
  });

  it("has zero axe violations in both locales and directions", async () => {
    const english = themedRender(<SiteFooter config={FULL_CONFIG} />, {
      dir: "ltr",
      lang: "en",
    });
    await axePass(english.container);
    english.unmount();

    const arabic = themedRender(<SiteFooter config={FULL_CONFIG} />, {
      dir: "rtl",
      lang: "ar",
      locale: "ar",
    });
    await axePass(arabic.container);
  });
});
