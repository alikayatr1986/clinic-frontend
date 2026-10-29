import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";

import { GallerySection } from "./GallerySection";
import arMessages from "../../../../messages/ar.json";
import enMessages from "../../../../messages/en.json";
import type { GalleryPublicCase, GallerySectionContent } from "@/features/gallery/types/gallery.types";
import { QueryProvider } from "@/lib/query-client-provider";

const mockCases: GalleryPublicCase[] = [
  {
    id: "1",
    url: "https://picsum.photos/seed/case1/1200/800",
    thumbnail_url: "https://picsum.photos/seed/case1/480/320",
    procedure_tag: "rhinoplasty",
    timeframe_badge: "6_months",
    before_position: "left",
    width: 1200,
    height: 800,
  },
  {
    id: "2",
    url: "https://picsum.photos/seed/case2/1200/800",
    thumbnail_url: "https://picsum.photos/seed/case2/480/320",
    procedure_tag: "rhinoplasty",
    timeframe_badge: "1_year",
    before_position: "left",
    width: 1200,
    height: 800,
  },
  {
    id: "3",
    url: "https://picsum.photos/seed/case3/1200/800",
    thumbnail_url: "https://picsum.photos/seed/case3/480/320",
    procedure_tag: "rhinoplasty",
    timeframe_badge: "3_months",
    before_position: "right",
    width: 1200,
    height: 800,
  },
  {
    id: "4",
    url: "https://picsum.photos/seed/case4/1200/800",
    thumbnail_url: "https://picsum.photos/seed/case4/480/320",
    procedure_tag: "rhinoplasty",
    timeframe_badge: "6_months",
    before_position: "left",
    width: 1200,
    height: 800,
  },
  {
    id: "5",
    url: "https://picsum.photos/seed/case5/1200/800",
    thumbnail_url: "https://picsum.photos/seed/case5/480/320",
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
  introduction: "Explore real patient stories and see the transformations for yourself.",
  statistics: [
    { key: "patients", value: "500+", label: "Happy Patients" },
    { key: "satisfaction", value: "98%", label: "Satisfaction Rate" },
    { key: "experience", value: "10+", label: "Years Experience" },
  ],
};

const mockContentAr: GallerySectionContent = {
  type: "gallery_section",
  lang: "ar",
  eyebrow: "معرض الحالات",
  heading: "أشخاص حقيقيون. نتائج حقيقية.",
  introduction: "استكشف قصص مرضانا وشاهد التحولات بنفسك.",
  statistics: [
    { key: "patients", value: "500+", label: "مريض سعيد" },
    { key: "satisfaction", value: "98%", label: "نسبة الرضا" },
    { key: "experience", value: "10+", label: "سنوات خبرة" },
  ],
};

const meta = {
  title: "Site/GallerySection",
  component: GallerySection,
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className="-m-6">
      <QueryProvider>
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <GallerySection
            initialCases={args.initialCases ?? mockCases}
            initialContent={args.initialContent ?? mockContentEn}
          />
        </NextIntlClientProvider>
      </QueryProvider>
    </div>
  ),
} satisfies Meta<typeof GallerySection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DesktopEnglish: Story = {
  parameters: { chromatic: { viewports: [1024, 1440] } },
};

export const MobileEnglish: Story = {
  parameters: { chromatic: { viewports: [320, 390, 480, 768] } },
};

export const Arabic: Story = {
  parameters: { chromatic: { viewports: [320, 390, 768, 1024, 1440] } },
  render: () => (
    <div className="-m-6" dir="rtl" lang="ar">
      <QueryProvider>
        <NextIntlClientProvider locale="ar" messages={arMessages}>
          <GallerySection
            initialCases={mockCases}
            initialContent={mockContentAr}
          />
        </NextIntlClientProvider>
      </QueryProvider>
    </div>
  ),
};

export const EmptyState: Story = {
  render: () => (
    <div className="-m-6">
      <QueryProvider>
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <GallerySection initialCases={[]} initialContent={null} />
        </NextIntlClientProvider>
      </QueryProvider>
    </div>
  ),
};

export const SingleCase: Story = {
  render: () => (
    <div className="-m-6">
      <QueryProvider>
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <GallerySection
            initialCases={[mockCases[0]]}
            initialContent={mockContentEn}
          />
        </NextIntlClientProvider>
      </QueryProvider>
    </div>
  ),
};
