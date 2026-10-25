import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, within } from "@testing-library/react";

import { TreatmentServicesSection } from "./TreatmentServicesSection";
import { TREATMENT_SERVICES, TREATMENT_SERVICES_ARTWORK, TREATMENT_SERVICES_DOCTOR_MARK, TREATMENT_SERVICES_TRUST } from "@/features/landing/constants/treatment-services.constants";
import { axePass, themedRender } from "@/test/utils";
import enMessages from "../../../../messages/en.json";
import arMessages from "../../../../messages/ar.json";

vi.mock("../assets/images/treatment-services-desktop-image.png", () => ({
  default: {
    src: "/_next/static/media/treatment-services-desktop-image.test.png",
    width: 1774,
    height: 887,
  },
}));

vi.mock("../assets/images/treatment-services-mobile-image.png", () => ({
  default: {
    src: "/_next/static/media/treatment-services-mobile-image.test.png",
    width: 940,
    height: 1673,
  },
}));

describe("TreatmentServicesSection", () => {
  it.each([
    { locale: "en" as const, dir: "ltr", copy: enMessages.treatmentServices },
    { locale: "ar" as const, dir: "rtl", copy: arMessages.treatmentServices },
  ])("renders live $locale content in reading order with an informational profile", ({ locale, dir, copy }) => {
    const { container } = themedRender(<TreatmentServicesSection />, { locale });
    const section = screen.getByRole("region", { name: copy.heading });
    expect(section).toHaveAttribute("id", "treatments");
    expect(section).toHaveAttribute("lang", locale);
    expect(section).toHaveAttribute("dir", dir);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(within(section).getByText(copy.eyebrow)).toBeInTheDocument();
    expect(within(section).getByText(copy.introduction)).toBeInTheDocument();
    const profile = screen.getByRole("article", { name: copy.profileName });
    expect(within(profile).getByRole("heading", { level: 3 })).toHaveTextContent(copy.profileName);
    expect(within(profile).getByText(copy.profileEyebrow)).toBeInTheDocument();
    expect(within(profile).getByText(copy.profileSpecialty)).toBeInTheDocument();
    const mark = profile.querySelector("img")!;
    const doctorMarkSrc = typeof TREATMENT_SERVICES_DOCTOR_MARK.src === "string"
      ? TREATMENT_SERVICES_DOCTOR_MARK.src
      : TREATMENT_SERVICES_DOCTOR_MARK.src.src;
    expect(mark.getAttribute("src")).toContain(encodeURIComponent(doctorMarkSrc));
    expect(mark).toHaveAttribute("alt", "");
    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(within(profile).queryByRole("link")).not.toBeInTheDocument();
    const services = within(screen.getByRole("list", { name: copy.servicesLabel })).getAllByRole("listitem");
    expect(services).toHaveLength(4);
    TREATMENT_SERVICES.forEach(({ key, image }, index) => {
      expect(within(services[index]).getByRole("heading", { level: 3 })).toHaveTextContent(copy.services[key].title);
      expect(within(services[index]).getByText(copy.services[key].description)).toBeInTheDocument();
      const icon = services[index].querySelector("img")!;
      const imageSrc = typeof image.src === "string" ? image.src : image.src.src;
      expect(icon.getAttribute("src")).toContain(encodeURIComponent(imageSrc));
      expect(icon).toHaveAttribute("alt", "");
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).not.toHaveClass("rtl:-scale-x-100");
    });
    expect(profile.compareDocumentPosition(services[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const links = within(section).getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAccessibleName(copy.primaryAction);
    expect(links[1]).toHaveAccessibleName(copy.secondaryAction);
    links.forEach(link => {
      expect(link).toHaveAttribute("href", "#contact");
      expect(link).toHaveClass("focus-visible:ring-2");
      expect(link.querySelector(".lucide-arrow-right")).toHaveClass("rtl:-scale-x-100");
      expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });
    expect(profile.textContent).not.toMatch(/Board.Certified|International Fellow|البورد/);
    const trustList = screen.getByRole("list", { name: copy.trustLabel });
    const trustItems = within(trustList).getAllByRole("listitem");
    expect(trustItems).toHaveLength(3);
    TREATMENT_SERVICES_TRUST.forEach(({ key }, index) => {
      expect(within(trustItems[index]).getByRole("heading", { level: 3 })).toHaveTextContent(copy.trust[key].title);
      expect(within(trustItems[index]).getByText(copy.trust[key].description)).toBeInTheDocument();
      const icon = trustItems[index].querySelector("svg")!;
      expect(icon).toHaveClass(["lucide-shield-check", "lucide-user-round", "lucide-globe"][index]);
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveAttribute("focusable", "false");
      expect(icon).not.toHaveClass("rtl:-scale-x-100");
    });
    expect(trustList.querySelectorAll("a, button, [tabindex]")).toHaveLength(0);
    expect(links[1].compareDocumentPosition(trustList) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const picture = container.querySelector("picture")!;
    expect(screen.getByRole("heading", { level: 2 }).compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(picture.compareDocumentPosition(profile) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("serves one decorative lazy image with separate desktop and mobile artwork", () => {
    const { container } = themedRender(<TreatmentServicesSection />);
    expect(container.querySelectorAll("picture img")).toHaveLength(1);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const img = container.querySelector("picture img")!;
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("aria-hidden", "true");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("width", String(TREATMENT_SERVICES_ARTWORK.mobile.width));
    expect(img).toHaveAttribute("height", String(TREATMENT_SERVICES_ARTWORK.mobile.height));
    expect(img.getAttribute("src")).toContain(encodeURIComponent(TREATMENT_SERVICES_ARTWORK.mobile.src));
    const source = container.querySelector("picture source")!;
    expect(source).toHaveAttribute("media", "(min-width: 1024px)");
    expect(source).toHaveAttribute("width", String(TREATMENT_SERVICES_ARTWORK.desktop.width));
    expect(source).toHaveAttribute("height", String(TREATMENT_SERVICES_ARTWORK.desktop.height));
    expect(source.getAttribute("srcset")).toContain(encodeURIComponent(TREATMENT_SERVICES_ARTWORK.desktop.src));
  });

  it.each(["en", "ar"] as const)("tabs through the two actions in primary/secondary order in %s", async (locale) => {
    const user = userEvent.setup();
    themedRender(<TreatmentServicesSection />, { locale });
    const links = screen.getAllByRole("link");
    await user.tab();
    expect(links[0]).toHaveFocus();
    await user.tab();
    expect(links[1]).toHaveFocus();
  });

  it.each(["en", "ar"] as const)("has zero axe violations in %s", async (locale) => {
    const { container } = themedRender(<TreatmentServicesSection />, { locale });
    await axePass(container);
  });
});
