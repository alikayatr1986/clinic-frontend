import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { GalleryCard } from "./GalleryCard";
import { axePass, themedRender } from "@/test/utils";
import type { GalleryCaptionContent, GalleryPublicCase } from "../types/gallery.types";
import enMessages from "../../../../messages/en.json";
import arMessages from "../../../../messages/ar.json";

const mockCase: GalleryPublicCase = {
  id: "case-card-uuid",
  url: "/api/v1/gallery/case-card-uuid/media/display",
  thumbnail_url: "/api/v1/gallery/case-card-uuid/media/thumbnail",
  procedure_tag: "rhinoplasty",
  timeframe_badge: "1-year",
  before_position: "left",
  width: 1200,
  height: 800,
};

const mockCaption: GalleryCaptionContent = {
  type: "gallery_caption",
  image_id: "case-card-uuid",
  lang: "en",
  alt_text: "Card case alt",
  caption: "Card case description",
};

describe("GalleryCard", () => {
  it("renders card comparison, badges, caption, and enlarge action", () => {
    themedRender(
      <GalleryCard
        item={mockCase}
        caption={mockCaption}
        onEnlarge={vi.fn()}
      />,
      { locale: "en", dir: "ltr" },
    );

    expect(screen.getByTestId("gallery-card")).toBeInTheDocument();
    expect(screen.getByText("Card case description")).toBeInTheDocument();
    expect(screen.getByText(enMessages.gallery.procedure_rhinoplasty)).toBeInTheDocument();
    expect(screen.getByText(enMessages.gallery.timeframe_1_year)).toBeInTheDocument();

    const enlargeBtn = screen.getByRole("button", {
      name: enMessages.gallery.enlargeCase.replace("{id}", mockCase.id),
    });
    expect(enlargeBtn).toBeInTheDocument();
  });

  it("calls onEnlarge when enlarge button is clicked", async () => {
    const user = userEvent.setup();
    const onEnlarge = vi.fn();

    themedRender(
      <GalleryCard
        item={mockCase}
        caption={mockCaption}
        onEnlarge={onEnlarge}
      />,
    );

    const enlargeBtn = screen.getByRole("button", {
      name: enMessages.gallery.enlargeCase.replace("{id}", mockCase.id),
    });
    await user.click(enlargeBtn);
    expect(onEnlarge).toHaveBeenCalledWith(mockCase);
  });

  it("anchors Before/After labels to physical sides in Arabic RTL", () => {
    themedRender(
      <GalleryCard
        item={mockCase}
        caption={{
          ...mockCaption,
          alt_text: "وصف الحالة في المعرض",
        }}
        onEnlarge={vi.fn()}
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

  it("passes axe accessibility checks", async () => {
    const { container } = themedRender(
      <GalleryCard
        item={mockCase}
        caption={mockCaption}
        onEnlarge={vi.fn()}
      />,
    );

    await axePass(container);
  });
});

