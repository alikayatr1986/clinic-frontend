import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";

import { HeroSection } from "./HeroSection";
import { HERO_ARTWORK, HERO_DESKTOP_MEDIA } from "@/features/landing/constants/hero.constants";
import { axePass, themedRender } from "@/test/utils";
import arMessages from "../../../../messages/ar.json";

vi.mock("../assets/images/hero-section-mobile-image.png", () => ({
  default: {
    src: "/_next/static/media/hero-section-mobile-image.test.png",
    width: 937,
    height: 1678,
  },
}));

vi.mock("../assets/images/hero-section-desktop-image.png", () => ({
  default: {
    src: "/_next/static/media/hero-section-desktop-image.test.png",
    width: 1672,
    height: 941,
  },
}));

describe("HeroSection", () => {
  it("renders the exact live copy with one h1, actions and all trust statements", () => {
    themedRender(<HeroSection />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Natural, Functional Rhinoplasty and ENT Care");
    expect(screen.getByText("ENT & FACIAL PLASTIC SURGERY", { exact: true }).textContent).toBe("ENT & FACIAL PLASTIC SURGERY");
    expect(screen.getByText("Personalized surgical care with a focus on natural results, advanced techniques and international standards.", { exact: true }).textContent).toBe("Personalized surgical care with a focus on natural results, advanced techniques and international standards.");
    expect(screen.getByRole("link", { name: "Book Free Video Consultation" })).toHaveAttribute("href", "#contact");
    expect(screen.getByRole("link", { name: "Explore Treatments" })).toHaveAttribute("href", "#treatments");
    for (const text of ["Internationally Accredited Hospitals", "Experienced ENT Specialist", "International Patient Support"]) expect(screen.getByText(text)).toBeVisible();
  });

  it("offers keyboard access to both actions and the local scrolling row with decorative icons", async () => {
    const user = userEvent.setup();
    const { container } = themedRender(<HeroSection />);
    await user.tab();
    expect(screen.getByRole("link", { name: "Book Free Video Consultation" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Explore Treatments" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("group", { name: /Clinic trust information/ })).toHaveFocus();
    expect(container.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(6);
    for (const icon of ["video", "arrow-right", "shield-plus", "user-round", "users-round"]) expect(container.querySelector(`.lucide-${icon}`)).not.toBeNull();
  });

  it("uses one decorative eager image and a desktop source at 1024px", () => {
    const { container } = themedRender(<HeroSection />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.querySelectorAll("img")).toHaveLength(1);
    expect(container.querySelector("img")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("source")).toHaveAttribute("media", HERO_DESKTOP_MEDIA);
    expect(container.querySelector("source")?.getAttribute("srcset")).toContain(encodeURIComponent(HERO_ARTWORK.desktop.src));
    expect(container.querySelector("source")).toHaveAttribute("width", "1672");
    expect(container.querySelector("source")).toHaveAttribute("height", "941");
    expect(container.querySelector("img")?.getAttribute("srcset")).toContain(encodeURIComponent(HERO_ARTWORK.mobile.src));
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(container.querySelector("img")).toHaveAttribute("width", "937");
    expect(container.querySelector("img")).toHaveAttribute("height", "1678");
    expect(container.querySelector("img")).toHaveAttribute("loading", "eager");
    expect(container.querySelector("img")).toHaveAttribute("fetchpriority", "high");
    expect(container.querySelector("img")).toHaveAttribute("sizes", "100vw");
  });

  it("renders Arabic draft with locale direction", () => {
    expect(Object.values(arMessages.hero).every(value => value !== "")).toBe(true);
    themedRender(<HeroSection />, { locale: "ar", dir: "rtl", lang: "ar" });
    expect(screen.getByRole("heading").textContent).toBe(arMessages.hero.heading);
    expect(screen.getByRole("heading").parentElement).toHaveAttribute("lang", "ar");
    expect(screen.getByRole("heading").parentElement).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("region")).toHaveAttribute("dir", "rtl");
  });

  it.each([
    ["en", "light"], ["en", "dark"], ["ar", "light"], ["ar", "dark"],
  ] as const)("uses locale direction and passes axe in the %s %s shell", async (locale, theme) => {
    const { container } = themedRender(<HeroSection />, {
      locale,
      theme,
      lang: locale,
      dir: locale === "ar" ? "rtl" : "ltr",
    });
    expect(screen.getByRole("region")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    expect(screen.getByRole("heading").parentElement).toHaveAttribute("lang", locale);
    await axePass(container);
  });
});
