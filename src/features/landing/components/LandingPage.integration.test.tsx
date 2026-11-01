import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LandingPage } from "./LandingPage";
import { themedRender } from "@/test/utils";
import enMessages from "../../../../messages/en.json";
import arMessages from "../../../../messages/ar.json";

vi.mock("@/features/landing/components/HeroSection", () => ({ HeroSection: () => null }));
vi.mock("@/features/landing/components/WhyTurkeySection", () => ({ WhyTurkeySection: () => null }));
vi.mock("@/features/landing/components/TreatmentServicesSection", () => ({ TreatmentServicesSection: () => null }));
vi.mock("@/features/landing/components/GallerySection", () => ({ GallerySection: () => null }));
vi.mock("@/features/landing/components/BlogsSection", () => ({ BlogsSection: () => null }));
vi.mock("@/features/contact/components/ContactSection", () => ({ ContactSection: () => <section id="contact" /> }));
vi.mock("@/features/footer/components/SiteFooter", () => ({ SiteFooter: () => null }));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  const { installRouterSpies } = await import("@/test/utils");
  return { ...actual, useRouter: () => installRouterSpies() };
});

describe("LandingPage FAQ integration", () => {
  it.each([["en", enMessages], ["ar", arMessages]] as const)(
    "connects FAQ navigation and consultation in %s",
    (locale, messages) => {
      const { container } = themedRender(<LandingPage />, { locale });
      const faq = screen.getByRole("region", { name: messages.faqSection.heading });
      expect(container.querySelectorAll("#faq")).toHaveLength(1);
      expect(faq.previousElementSibling).toHaveAttribute("id", "contact");
      expect(within(screen.getByRole("banner")).getByRole("link", { name: messages.nav.faq })).toHaveAttribute("href", "#faq");
      expect(within(faq).getByRole("link", { name: messages.header.cta })).toHaveAttribute("href", "#contact");
    },
  );
});
