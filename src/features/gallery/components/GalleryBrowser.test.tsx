import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor, within } from "@testing-library/react";
import { GalleryBrowser } from "./GalleryBrowser";
import { axePass, themedRender } from "@/test/utils";
import * as galleryService from "../services/gallery.service";
import type { GalleryPublicCase } from "../types/gallery.types";
import enMessages from "../../../../messages/en.json";

const mockPush = vi.fn((url: string) => {
  const query = url.split("?")[1] || "";
  mockSearchParams = new URLSearchParams(query);
});
const mockReplace = vi.fn((url: string) => {
  const query = url.split("?")[1] || "";
  mockSearchParams = new URLSearchParams(query);
});
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => "/gallery",
  useSearchParams: () => mockSearchParams,
}));

vi.mock("../services/gallery.service", () => ({
  fetchGalleryCases: vi.fn(),
  fetchGalleryContent: vi.fn(),
}));

const mockCases: GalleryPublicCase[] = Array.from({ length: 15 }, (_, i) => ({
  id: `case-${i + 1}`,
  url: `/api/v1/gallery/case-${i + 1}/media/display`,
  thumbnail_url: `/api/v1/gallery/case-${i + 1}/media/thumbnail`,
  procedure_tag: i % 2 === 0 ? "rhinoplasty" : "septoplasty",
  timeframe_badge: "6-months",
  before_position: i % 2 === 0 ? "left" : "right",
  width: 1200,
  height: 800,
}));

describe("GalleryBrowser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();

    vi.mocked(galleryService.fetchGalleryCases).mockResolvedValue({
      data: mockCases.slice(0, 12),
      page: 1,
      page_size: 12,
      total: mockCases.length,
    });

    vi.mocked(galleryService.fetchGalleryContent).mockResolvedValue({
      section: {
        type: "gallery_section",
        lang: "en",
        eyebrow: "GALLERY",
        heading: "Real People. Real Results.",
        introduction: "Explore patient transformations.",
        statistics: [],
      },
      captions: {
        "case-1": {
          type: "gallery_caption",
          image_id: "case-1",
          lang: "en",
          alt_text: "Case 1 alt text",
          caption: "Case 1 caption",
        },
      },
    });
  });

  it("renders heading, filters, cases grid, result count, and pagination", async () => {
    themedRender(<GalleryBrowser />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Real People. Real Results.",
      );
    });

    // Check filter selects
    expect(
      screen.getByRole("combobox", { name: enMessages.gallery.filterProcedure }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: enMessages.gallery.filterTimeframe }),
    ).toBeInTheDocument();

    // Check result count
    expect(screen.getByTestId("gallery-results-count")).toHaveTextContent(
      enMessages.gallery.resultCountOther.replace("{count}", String(mockCases.length)),
    );

    // Check grid cards
    const cards = screen.getAllByTestId("gallery-card");
    expect(cards).toHaveLength(12);

    // Check pagination controls
    expect(screen.getByTestId("gallery-pagination")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: enMessages.gallery.previousPage }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: enMessages.gallery.nextPage }),
    ).not.toBeDisabled();
  });

  it("updates URL and resets page to 1 on procedure filter change", async () => {
    const user = userEvent.setup();
    themedRender(<GalleryBrowser />);

    await waitFor(() => {
      expect(screen.getAllByTestId("gallery-card")).toHaveLength(12);
    });

    const procedureSelect = screen.getByRole("combobox", {
      name: enMessages.gallery.filterProcedure,
    });
    await user.selectOptions(procedureSelect, "rhinoplasty");

    expect(mockPush).toHaveBeenCalledWith("/gallery?procedure_tag=rhinoplasty");
  });

  it("shows and operates the reset filters button", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams("procedure_tag=rhinoplasty");

    themedRender(<GalleryBrowser />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: enMessages.gallery.resetFilters }),
      ).toBeInTheDocument();
    });

    const resetBtn = screen.getByRole("button", {
      name: enMessages.gallery.resetFilters,
    });
    await user.click(resetBtn);

    expect(mockPush).toHaveBeenCalledWith("/gallery");
  });

  it("navigates to next page on pagination click", async () => {
    const user = userEvent.setup();
    themedRender(<GalleryBrowser />);

    await waitFor(() => {
      expect(screen.getByTestId("gallery-pagination")).toBeInTheDocument();
    });

    const nextBtn = screen.getByRole("button", {
      name: enMessages.gallery.nextPage,
    });
    await user.click(nextBtn);

    expect(mockPush).toHaveBeenCalledWith("/gallery?page=2");
  });

  it("recovers gracefully on invalid query parameters (out of bounds page)", async () => {
    mockSearchParams = new URLSearchParams("page=9999");
    const recoveredCases = mockCases.slice(12, 14);
    vi.mocked(galleryService.fetchGalleryCases)
      .mockResolvedValueOnce({ data: [], page: 9999, page_size: 12, total: 15 })
      .mockResolvedValueOnce({ data: recoveredCases, page: 1, page_size: 12, total: 2 });

    themedRender(<GalleryBrowser />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/gallery");
      expect(screen.getByTestId("gallery-recovery-notice")).toHaveTextContent(
        enMessages.gallery.recoveryNotice,
      );
      expect(galleryService.fetchGalleryCases).toHaveBeenNthCalledWith(1, {
        page: 9999,
        page_size: 12,
        procedure_tag: "",
        timeframe_badge: "",
      });
      expect(galleryService.fetchGalleryCases).toHaveBeenNthCalledWith(2, {
        page: 1,
        page_size: 12,
        procedure_tag: "",
        timeframe_badge: "",
      });
      expect(screen.getAllByTestId("gallery-card").map(card => card.getAttribute("data-case-id")))
        .toEqual(recoveredCases.map(item => item.id));
      expect(screen.getByTestId("gallery-results-count")).toHaveTextContent(
        enMessages.gallery.resultCountOther.replace("{count}", "2"),
      );
    });
  });

  it("recovers gracefully on invalid filter code client-side", async () => {
    mockSearchParams = new URLSearchParams("procedure_tag=invalid-filter-code");

    themedRender(<GalleryBrowser />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/gallery");
      expect(screen.getByTestId("gallery-recovery-notice")).toHaveTextContent(
        enMessages.gallery.recoveryNotice,
      );
    });
  });

  it("recovers gracefully on backend 400 validation error", async () => {
    const error400 = new Error("Backend validation error");
    (error400 as unknown as { status: number }).status = 400;

    vi.mocked(galleryService.fetchGalleryCases)
      .mockRejectedValueOnce(error400)
      .mockResolvedValueOnce({
        data: mockCases.slice(0, 12),
        page: 1,
        page_size: 12,
        total: mockCases.length,
      });

    themedRender(<GalleryBrowser />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/gallery");
      expect(screen.getByTestId("gallery-recovery-notice")).toHaveTextContent(
        enMessages.gallery.recoveryNotice,
      );
    });
  });

  it("renders localized empty state when 0 cases match", async () => {
    vi.mocked(galleryService.fetchGalleryCases).mockResolvedValueOnce({
      data: [],
      page: 1,
      page_size: 12,
      total: 0,
    });

    themedRender(<GalleryBrowser />);

    await waitFor(() => {
      expect(screen.getByTestId("gallery-empty")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: enMessages.gallery.emptyTitle }),
      ).toBeInTheDocument();
    });
  });

  it("does not publish mock marketing claims without approved section content", async () => {
    vi.mocked(galleryService.fetchGalleryContent).mockResolvedValueOnce({
      section: null,
      captions: {},
    });

    themedRender(<GalleryBrowser />);

    await waitFor(() => {
      expect(screen.getAllByTestId("gallery-card")).toHaveLength(12);
    });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Before & After Gallery",
    );
    expect(screen.queryByText(/real people\. real results\./i)).not.toBeInTheDocument();
    expect(screen.queryByText(/commitment to natural beauty/i)).not.toBeInTheDocument();
  });

  it("renders localized error state with retry on network/500 failure", async () => {
    const user = userEvent.setup();
    const error500 = new Error("503 Service Unavailable");
    (error500 as unknown as { status: number }).status = 503;

    vi.mocked(galleryService.fetchGalleryCases).mockRejectedValue(error500);

    themedRender(<GalleryBrowser />);

    await waitFor(() => {
      expect(screen.getByTestId("gallery-error")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: enMessages.gallery.errorTitle }),
      ).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole("button", { name: enMessages.gallery.retry });
    vi.mocked(galleryService.fetchGalleryCases).mockResolvedValue({
      data: mockCases.slice(0, 12),
      page: 1,
      page_size: 12,
      total: mockCases.length,
    });

    await user.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByTestId("gallery-grid")).toBeInTheDocument();
    });
  });

  it("opens lightbox dialog when enlarge comparison is clicked", async () => {
    const user = userEvent.setup();
    themedRender(<GalleryBrowser />);

    await waitFor(() => {
      expect(screen.getAllByTestId("gallery-card")).toHaveLength(12);
    });

    const firstCard = screen.getAllByTestId("gallery-card")[0];
    const enlargeBtn = within(firstCard).getByRole("button", {
      name: enMessages.gallery.enlargeCase.replace("{id}", "case-1"),
    });

    await user.click(enlargeBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: enMessages.gallery.dialogTitle }),
    ).toBeInTheDocument();
  });

  it("passes axe accessibility checks", async () => {
    const { container } = themedRender(<GalleryBrowser />);

    await waitFor(() => {
      expect(screen.getByTestId("gallery-grid")).toBeInTheDocument();
    });

    await axePass(container);
  });
});
