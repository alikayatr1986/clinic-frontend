import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { GalleryComparison } from "./GalleryComparison";
import { axePass, themedRender } from "@/test/utils";
import type { GalleryPublicCase } from "../types/gallery.types";
import enMessages from "../../../../messages/en.json";
import arMessages from "../../../../messages/ar.json";

const mockCaseLeft: GalleryPublicCase = {
  id: "case-left-uuid",
  url: "/api/v1/gallery/case-left-uuid/media/display",
  thumbnail_url: "/api/v1/gallery/case-left-uuid/media/thumbnail",
  procedure_tag: "rhinoplasty",
  timeframe_badge: "6_months",
  before_position: "left",
  width: 1200,
  height: 800,
};

const mockCaseRight: GalleryPublicCase = {
  id: "case-right-uuid",
  url: "/api/v1/gallery/case-right-uuid/media/display",
  thumbnail_url: "/api/v1/gallery/case-right-uuid/media/thumbnail",
  procedure_tag: "rhinoplasty",
  timeframe_badge: "1_year",
  before_position: "right",
  width: 1200,
  height: 800,
};

describe("GalleryComparison", () => {
  it("renders image and places Before on left and After on right when before_position is left", () => {
    themedRender(
      <GalleryComparison
        item={mockCaseLeft}
        caption={{
          type: "gallery_caption",
          image_id: "case-left-uuid",
          lang: "en",
          alt_text: "Custom alt description for left case",
          caption: "Custom caption",
        }}
      />,
      { locale: "en", dir: "ltr" },
    );

    const img = screen.getByRole("img", { name: "Custom alt description for left case" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", mockCaseLeft.url);

    const beforeOverlay = screen.getByTestId("overlay-before");
    const afterOverlay = screen.getByTestId("overlay-after");

    expect(beforeOverlay).toHaveTextContent(enMessages.gallery.before);
    expect(beforeOverlay).toHaveClass("left-3");
    expect(afterOverlay).toHaveTextContent(enMessages.gallery.after);
    expect(afterOverlay).toHaveClass("right-3");
  });

  it("places Before on right and After on left when before_position is right", () => {
    themedRender(<GalleryComparison item={mockCaseRight} />, {
      locale: "en",
      dir: "ltr",
    });

    const beforeOverlay = screen.getByTestId("overlay-before");
    const afterOverlay = screen.getByTestId("overlay-after");

    expect(beforeOverlay).toHaveTextContent(enMessages.gallery.before);
    expect(beforeOverlay).toHaveClass("right-3");
    expect(afterOverlay).toHaveTextContent(enMessages.gallery.after);
    expect(afterOverlay).toHaveClass("left-3");
  });

  it("preserves physical left/right positions for Arabic without RTL mirroring", () => {
    themedRender(
      <GalleryComparison
        item={mockCaseLeft}
        caption={{
          type: "gallery_caption",
          image_id: "case-left-uuid",
          lang: "ar",
          alt_text: "وصف الحالة باللغة العربية",
          caption: "تعليق الحالة",
        }}
      />,
      { locale: "ar", dir: "rtl" },
    );

    const beforeOverlay = screen.getByTestId("overlay-before");
    const afterOverlay = screen.getByTestId("overlay-after");

    expect(beforeOverlay).toHaveTextContent(arMessages.gallery.before);
    expect(beforeOverlay).toHaveClass("left-3");
    expect(afterOverlay).toHaveTextContent(arMessages.gallery.after);
    expect(afterOverlay).toHaveClass("right-3");
  });

  it("passes axe accessibility check with zero violations", async () => {
    const { container } = themedRender(
      <GalleryComparison item={mockCaseLeft} />,
      { locale: "en", dir: "ltr" },
    );
    await axePass(container);
  });
});

