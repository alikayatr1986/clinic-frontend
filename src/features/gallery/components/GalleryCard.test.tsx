import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { GalleryCard } from "./GalleryCard";
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

let mockDynamicTimeframes: { code: string; en: string; ar: string; status?: string; retired?: boolean }[] = [];
vi.mock("../hooks/useGalleryOptions", () => ({
  useGalleryOptions: () => ({
    timeframes: mockDynamicTimeframes,
    procedures: [],
    isLoading: false,
    isError: false,
    error: null,
    retry: vi.fn(),
    refetch: vi.fn(),
  }),
}));

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

  it("renders localized dynamic timeframe badge when available", () => {
    mockDynamicTimeframes = [
      { code: "0-3-months", en: "0-3 Months Post-Op", ar: "0-3 أشهر بعد الجراحة", status: "active" },
    ];
    const caseWithDynamicTf: GalleryPublicCase = {
      ...mockCase,
      timeframe_badge: "0-3-months",
    };

    const { unmount } = themedRender(
      <GalleryCard
        item={caseWithDynamicTf}
        caption={mockCaption}
        onEnlarge={vi.fn()}
      />,
      { locale: "en", dir: "ltr" },
    );

    expect(screen.getByText("0-3 Months Post-Op")).toBeInTheDocument();
    unmount();

    themedRender(
      <GalleryCard
        item={caseWithDynamicTf}
        caption={mockCaption}
        onEnlarge={vi.fn()}
      />,
      { locale: "ar", dir: "rtl" },
    );

    expect(screen.getByText("0-3 أشهر بعد الجراحة")).toBeInTheDocument();
  });

  it("renders localized label with (Retired) indicator for historical case referencing retired timeframe", () => {
    mockDynamicTimeframes = [
      { code: "retired-time", en: "Old 3 Months", ar: "3 أشهر قديمة", status: "retired", retired: true },
    ];
    const caseWithRetiredTf: GalleryPublicCase = {
      ...mockCase,
      timeframe_badge: "retired-time",
    };

    const { unmount } = themedRender(
      <GalleryCard
        item={caseWithRetiredTf}
        caption={mockCaption}
        onEnlarge={vi.fn()}
      />,
      { locale: "en", dir: "ltr" },
    );

    expect(screen.getByText("Old 3 Months (Retired)")).toBeInTheDocument();
    unmount();

    themedRender(
      <GalleryCard
        item={caseWithRetiredTf}
        caption={mockCaption}
        onEnlarge={vi.fn()}
      />,
      { locale: "ar", dir: "rtl" },
    );

    expect(screen.getByText("3 أشهر قديمة (متقاعد)")).toBeInTheDocument();
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
    expect(onEnlarge).toHaveBeenCalledWith(mockCase, expect.any(HTMLButtonElement));
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

