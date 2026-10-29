import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, within } from "@testing-library/react";

import { GallerySection } from "./GallerySection";
import { fetchGalleryContent, fetchLandingGalleryCases } from "@/features/gallery/services/gallery.service";

vi.mock("@/features/gallery/services/gallery.service", () => ({
  fetchGalleryContent: vi.fn(),
  fetchLandingGalleryCases: vi.fn(),
}));
import { axePass, themedRender } from "@/test/utils";
import type {
  GalleryCaptionContent,
  GalleryPublicCase,
  GallerySectionContent,
} from "@/features/gallery/types/gallery.types";
import enMessages from "../../../../messages/en.json";

const mockCases: GalleryPublicCase[] = [
  {
    id: "case-1",
    url: "/api/v1/gallery/case-1/media/display",
    thumbnail_url: "/api/v1/gallery/case-1/media/thumbnail",
    procedure_tag: "rhinoplasty",
    timeframe_badge: "6_months",
    before_position: "left",
    width: 1200,
    height: 800,
  },
  {
    id: "case-2",
    url: "/api/v1/gallery/case-2/media/display",
    thumbnail_url: "/api/v1/gallery/case-2/media/thumbnail",
    procedure_tag: "rhinoplasty",
    timeframe_badge: "1_year",
    before_position: "left",
    width: 1200,
    height: 800,
  },
  {
    id: "case-3",
    url: "/api/v1/gallery/case-3/media/display",
    thumbnail_url: "/api/v1/gallery/case-3/media/thumbnail",
    procedure_tag: "rhinoplasty",
    timeframe_badge: "3_months",
    before_position: "right",
    width: 1200,
    height: 800,
  },
  {
    id: "case-4",
    url: "/api/v1/gallery/case-4/media/display",
    thumbnail_url: "/api/v1/gallery/case-4/media/thumbnail",
    procedure_tag: "rhinoplasty",
    timeframe_badge: "6_months",
    before_position: "left",
    width: 1200,
    height: 800,
  },
  {
    id: "case-5",
    url: "/api/v1/gallery/case-5/media/display",
    thumbnail_url: "/api/v1/gallery/case-5/media/thumbnail",
    procedure_tag: "rhinoplasty",
    timeframe_badge: "1_year",
    before_position: "left",
    width: 1200,
    height: 800,
  },
];

const mockContentEn: GallerySectionContent = {
  type: "gallery_section",
  lang: "en",
  eyebrow: "GALLERY",
  heading: "Real People. Real Results.",
  introduction: "Explore real patient stories and see the transformations.",
  statistics: [
    { key: "patients", value: "500+", label: "Happy Patients" },
    { key: "satisfaction", value: "98%", label: "Satisfaction Rate" },
    { key: "experience", value: "10+", label: "Years of Experience" },
  ],
};

const mockCaptions: Record<string, GalleryCaptionContent> = {
  "case-1": {
    type: "gallery_caption",
    image_id: "case-1",
    lang: "en",
    alt_text: "Case 1 rhinoplasty before and after",
    caption: "Case 1 Caption",
  },
  "case-3": {
    type: "gallery_caption",
    image_id: "case-3",
    lang: "en",
    alt_text: "Case 3 rhinoplasty before and after",
    caption: "Case 3 Caption",
  },
};

describe("GallerySection", () => {
  it("recovers gallery content after retrying an initial fetch failure", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchLandingGalleryCases)
      .mockRejectedValueOnce(new Error("Unavailable"))
      .mockResolvedValueOnce(mockCases);
    vi.mocked(fetchGalleryContent).mockResolvedValueOnce({
      section: mockContentEn,
      captions: mockCaptions,
    });

    themedRender(<GallerySection />, { locale: "en", dir: "ltr" });

    expect(await screen.findByRole("alert")).toHaveTextContent(enMessages.gallery.errorTitle);
    await user.click(screen.getByRole("button", { name: enMessages.gallery.retry }));

    expect(await screen.findByRole("region", { name: mockContentEn.heading })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: mockCaptions["case-1"].alt_text })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders loading skeleton and resolves gallery content when mounted without initial data", async () => {
    vi.mocked(fetchLandingGalleryCases).mockResolvedValueOnce(mockCases);
    vi.mocked(fetchGalleryContent).mockResolvedValueOnce({
      section: mockContentEn,
      captions: mockCaptions,
    });

    themedRender(<GallerySection />, { locale: "en", dir: "ltr" });

    expect(screen.getByTestId("gallery-loading")).toBeInTheDocument();

    expect(await screen.findByRole("region", { name: mockContentEn.heading })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: mockCaptions["case-1"].alt_text })).toBeInTheDocument();
    expect(screen.queryByTestId("gallery-loading")).not.toBeInTheDocument();
  });

  it("renders 5 cases with featured case 1, 5 dots, 4 supporting thumbnails, and approved statistics", () => {
    themedRender(
      <GallerySection
        initialCases={mockCases}
        initialContent={mockContentEn}
        initialCaptions={mockCaptions}
      />,
      { locale: "en", dir: "ltr" },
    );

    const section = screen.getByRole("region", { name: mockContentEn.heading });
    expect(section).toHaveAttribute("id", "gallery");

    // Eyebrow and heading
    expect(within(section).getByText(mockContentEn.eyebrow)).toBeInTheDocument();
    expect(within(section).getByText(mockContentEn.introduction)).toBeInTheDocument();

    // Featured image is case-1
    const featuredImg = screen.getByRole("img", { name: "Case 1 rhinoplasty before and after" });
    expect(featuredImg).toBeInTheDocument();

    // 5 pagination dots
    const dotsGroup = screen.getByRole("group", { name: enMessages.gallery.dotsLabel });
    const dots = within(dotsGroup).getAllByRole("button");
    expect(dots).toHaveLength(5);
    expect(dots[0]).toHaveAttribute("aria-pressed", "true");
    expect(dots[1]).toHaveAttribute("aria-pressed", "false");

    // Supporting thumbnails (4 items, excluding case 1)
    const thumbnails = screen.getAllByRole("button", { name: /View case/ });
    expect(thumbnails).toHaveLength(4);

    // Statistics
    const statsContainer = screen.getByTestId("gallery-statistics");
    expect(within(statsContainer).getByText("500+")).toBeInTheDocument();
    expect(within(statsContainer).getByText("Happy Patients")).toBeInTheDocument();
    const mobileStats = screen.getByTestId("gallery-statistics-mobile");
    const introduction = within(section).getByText(mockContentEn.introduction);
    expect(introduction.compareDocumentPosition(mobileStats)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(mobileStats.compareDocumentPosition(featuredImg)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    // CTA
    const cta = screen.getByRole("link", { name: enMessages.gallery.cta });
    expect(cta).toHaveAttribute("href", "/gallery");
  });

  it("updates featured case when clicking dot", async () => {
    const user = userEvent.setup();
    themedRender(
      <GallerySection
        initialCases={mockCases}
        initialContent={mockContentEn}
        initialCaptions={mockCaptions}
      />,
      { locale: "en", dir: "ltr" },
    );

    const dotsGroup = screen.getByRole("group", { name: enMessages.gallery.dotsLabel });
    const dots = within(dotsGroup).getAllByRole("button");

    // Click dot 3
    await user.click(dots[2]);

    expect(dots[2]).toHaveAttribute("aria-pressed", "true");
    expect(dots[0]).toHaveAttribute("aria-pressed", "false");

    // Featured image is now case-3
    const featuredImg = screen.getByRole("img", { name: "Case 3 rhinoplasty before and after" });
    expect(featuredImg).toBeInTheDocument();
  });

  it("updates featured case when clicking a supporting thumbnail", async () => {
    const user = userEvent.setup();
    themedRender(
      <GallerySection
        initialCases={mockCases}
        initialContent={mockContentEn}
        initialCaptions={mockCaptions}
      />,
      { locale: "en", dir: "ltr" },
    );

    // Click thumbnail for case 3
    const thumbCase3 = screen.getByRole("button", { name: "View case 3" });
    await user.click(thumbCase3);

    // Featured image is now case-3
    const featuredImg = screen.getByRole("img", { name: "Case 3 rhinoplasty before and after" });
    expect(featuredImg).toBeInTheDocument();
  });

  it("renders clean single-case layout with zero redundant dots and zero thumbnails when only 1 case is available", () => {
    themedRender(
      <GallerySection
        initialCases={[mockCases[0]]}
        initialContent={mockContentEn}
        initialCaptions={mockCaptions}
      />,
      { locale: "en", dir: "ltr" },
    );

    expect(screen.getByRole("img", { name: "Case 1 rhinoplasty before and after" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: enMessages.gallery.dotsLabel })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Select case/ })).not.toBeInTheDocument();
  });

  it("renders empty state without patient photos or broken links when 0 cases available", () => {
    themedRender(
      <GallerySection initialCases={[]} initialContent={null} />,
      { locale: "en", dir: "ltr" },
    );

    expect(screen.getByTestId("gallery-empty")).toBeInTheDocument();
    expect(screen.getByText(enMessages.gallery.emptyDescription)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: enMessages.gallery.cta })).not.toBeInTheDocument();
  });

  it("renders in Arabic with correct RTL mirroring and live Before/After tags", () => {
    themedRender(
      <GallerySection
        initialCases={mockCases}
        initialContent={{
          type: "gallery_section",
          lang: "ar",
          eyebrow: "٦. معرض الحالات",
          heading: "أشخاص حقيقيون. نتائج حقيقية.",
          introduction: "استكشف قصص مرضانا وشاهد التحولات بنفسك.",
          statistics: [
            { key: "patients", value: "500+", label: "مريض سعيد" },
          ],
        }}
      />,
      { locale: "ar", dir: "rtl" },
    );

    const section = screen.getByRole("region", { name: "أشخاص حقيقيون. نتائج حقيقية." });
    expect(section).toHaveAttribute("dir", "rtl");
    expect(section).toHaveAttribute("lang", "ar");
    expect(within(section).getByText("معرض الحالات")).toBeInTheDocument();
    expect(within(section).getAllByText("500+")).toHaveLength(2);
  });

  it("passes axe accessibility verification with zero violations", async () => {
    const { container } = themedRender(
      <GallerySection
        initialCases={mockCases}
        initialContent={mockContentEn}
        initialCaptions={mockCaptions}
      />,
      { locale: "en", dir: "ltr" },
    );
    await axePass(container);
  });
});
