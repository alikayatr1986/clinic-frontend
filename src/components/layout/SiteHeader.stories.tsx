import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SiteHeader } from "./SiteHeader";
import { HEADER_NAV_ITEMS, HEADER_CTA_HREF } from "@/test/header.fixtures";

const meta = {
  title: "Site/SiteHeader",
  component: SiteHeader,
  parameters: { layout: "fullscreen" },
  argTypes: {
    activePath: { control: "text" },
  },
  args: { items: HEADER_NAV_ITEMS, ctaHref: HEADER_CTA_HREF, activePath: "/" },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

function Frame({
  theme,
  dir,
  items,
  ctaHref,
  activePath,
  mobileNavDefaultOpen,
}: {
  items: React.ComponentProps<typeof SiteHeader>["items"];
  ctaHref: string;
  theme: "light" | "dark";
  dir: "ltr" | "rtl";
  activePath?: string;
  mobileNavDefaultOpen?: boolean;
}) {
  return (
    <div
      dir={dir}
      lang={dir === "rtl" ? "ar" : "en"}
      className={theme === "dark" ? "dark" : undefined}
    >
      <SiteHeader
        items={items}
        ctaHref={ctaHref}
        activePath={activePath}
        mobileNavDefaultOpen={mobileNavDefaultOpen}
      />
    </div>
  );
}

export const LightLtr: Story = {
  render: ({ activePath, items, ctaHref }) => (
    <Frame items={items} ctaHref={ctaHref} theme="light" dir="ltr" activePath={activePath} />
  ),
};

export const LightRtl: Story = {
  render: ({ activePath, items, ctaHref }) => (
    <Frame items={items} ctaHref={ctaHref} theme="light" dir="rtl" activePath={activePath} />
  ),
};

export const DarkLtr: Story = {
  render: ({ activePath, items, ctaHref }) => (
    <Frame items={items} ctaHref={ctaHref} theme="dark" dir="ltr" activePath={activePath} />
  ),
};

export const DarkRtl: Story = {
  render: ({ activePath, items, ctaHref }) => (
    <Frame items={items} ctaHref={ctaHref} theme="dark" dir="rtl" activePath={activePath} />
  ),
};

export const SectionActive: Story = {
  args: { activePath: "/#treatments" },
  render: ({ activePath, items, ctaHref }) => (
    <Frame items={items} ctaHref={ctaHref} theme="light" dir="ltr" activePath={activePath} />
  ),
};

const mobileParameters = {
  chromatic: { viewports: [390] },
};

export const MobileLightLtr: Story = {
  parameters: mobileParameters,
  render: ({ activePath, items, ctaHref }) => (
    <Frame items={items} ctaHref={ctaHref} theme="light" dir="ltr" activePath={activePath} />
  ),
};

export const MobileLightRtl: Story = {
  parameters: mobileParameters,
  render: ({ activePath, items, ctaHref }) => (
    <Frame items={items} ctaHref={ctaHref} theme="light" dir="rtl" activePath={activePath} />
  ),
};

export const MobileDarkLtr: Story = {
  parameters: mobileParameters,
  render: ({ activePath, items, ctaHref }) => (
    <Frame items={items} ctaHref={ctaHref} theme="dark" dir="ltr" activePath={activePath} />
  ),
};

export const MobileDarkRtl: Story = {
  parameters: mobileParameters,
  render: ({ activePath, items, ctaHref }) => (
    <Frame items={items} ctaHref={ctaHref} theme="dark" dir="rtl" activePath={activePath} />
  ),
};

export const MobileMenuOpen: Story = {
  parameters: mobileParameters,
  args: { activePath: "/" },
  render: ({ activePath, items, ctaHref }) => (
    <Frame
      items={items}
      ctaHref={ctaHref}
      theme="light"
      dir="ltr"
      activePath={activePath}
      mobileNavDefaultOpen
    />
  ),
};
