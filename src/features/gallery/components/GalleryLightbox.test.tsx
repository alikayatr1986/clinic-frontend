import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { GalleryLightbox } from "./GalleryLightbox";
import { axePass, themedRender } from "@/test/utils";
import type { GalleryCaptionContent, GalleryPublicCase } from "../types/gallery.types";
import enMessages from "../../../../messages/en.json";
import arMessages from "../../../../messages/ar.json";

vi.mock("@/features/procedures/hooks/useProcedures", () => ({
  useProcedures: () => ({ procedures: [
    { code: "rhinoplasty", en: "Rhinoplasty", ar: "تجميل الأنف" },
    { code: "revision_rhinoplasty", en: "Revision rhinoplasty", ar: "إعادة تجميل الأنف" },
  ], error: false, retry: vi.fn() }),
}));

const mockCase: GalleryPublicCase = {
  id: "case-lightbox-uuid",
  url: "/api/v1/gallery/case-lightbox-uuid/media/display",
  thumbnail_url: "/api/v1/gallery/case-lightbox-uuid/media/thumbnail",
  procedure_tag: "rhinoplasty",
  timeframe_badge: "6-months",
  before_position: "left",
  width: 1200,
  height: 800,
};

const mockCaption: GalleryCaptionContent = {
  type: "gallery_caption",
  image_id: "case-lightbox-uuid",
  lang: "en",
  alt_text: "Enlarged comparison view",
  caption: "Detailed post-operative symmetry",
};

describe("GalleryLightbox", () => {
  it("renders comparison, badges, caption, and title when open", () => {
    themedRender(
      <GalleryLightbox
        item={mockCase}
        caption={mockCaption}
        open={true}
        onOpenChange={vi.fn()}
      />,
      { locale: "en", dir: "ltr" },
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: enMessages.gallery.dialogTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText("Detailed post-operative symmetry")).toBeInTheDocument();
    expect(screen.getByText(enMessages.gallery.procedure_rhinoplasty)).toBeInTheDocument();
    expect(screen.getByText(enMessages.gallery.timeframe_6_months)).toBeInTheDocument();

    const img = screen.getByRole("img", { name: "Enlarged comparison view" });
    expect(img).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    themedRender(
      <GalleryLightbox
        item={mockCase}
        caption={mockCaption}
        open={true}
        onOpenChange={onOpenChange}
      />,
    );

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    themedRender(
      <GalleryLightbox
        item={mockCase}
        caption={mockCaption}
        open={true}
        onOpenChange={onOpenChange}
      />,
    );

    const closeBtn = screen.getByRole("button", { name: enMessages.ui.close });
    await user.click(closeBtn);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("anchors Before/After labels to physical sides in Arabic RTL", () => {
    themedRender(
      <GalleryLightbox
        item={mockCase}
        caption={{
          ...mockCaption,
          alt_text: "مقارنة قبل وبعد مكبرة",
        }}
        open={true}
        onOpenChange={vi.fn()}
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
      <GalleryLightbox
        item={mockCase}
        caption={mockCaption}
        open={true}
        onOpenChange={vi.fn()}
      />,
    );

    await axePass(container);
  });
});

