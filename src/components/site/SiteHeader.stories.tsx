import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SiteHeader } from "./SiteHeader";

const meta = {
  title: "Site/SiteHeader",
  component: SiteHeader,
  parameters: { layout: "fullscreen" },
  argTypes: {
    activePath: { control: "text" },
  },
  args: { activePath: "/" },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

function Frame({
  theme,
  dir,
  activePath,
  mobileNavDefaultOpen,
}: {
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
        activePath={activePath}
        mobileNavDefaultOpen={mobileNavDefaultOpen}
      />
    </div>
  );
}

export const LightLtr: Story = {
  render: ({ activePath }) => (
    <Frame theme="light" dir="ltr" activePath={activePath} />
  ),
};

export const LightRtl: Story = {
  render: ({ activePath }) => (
    <Frame theme="light" dir="rtl" activePath={activePath} />
  ),
};

export const DarkLtr: Story = {
  render: ({ activePath }) => (
    <Frame theme="dark" dir="ltr" activePath={activePath} />
  ),
};

export const DarkRtl: Story = {
  render: ({ activePath }) => (
    <Frame theme="dark" dir="rtl" activePath={activePath} />
  ),
};

export const SectionActive: Story = {
  args: { activePath: "/#treatments" },
  render: ({ activePath }) => (
    <Frame theme="light" dir="ltr" activePath={activePath} />
  ),
};

const mobileParameters = {
  chromatic: { viewports: [390] },
};

export const MobileLightLtr: Story = {
  parameters: mobileParameters,
  render: ({ activePath }) => (
    <Frame theme="light" dir="ltr" activePath={activePath} />
  ),
};

export const MobileLightRtl: Story = {
  parameters: mobileParameters,
  render: ({ activePath }) => (
    <Frame theme="light" dir="rtl" activePath={activePath} />
  ),
};

export const MobileDarkLtr: Story = {
  parameters: mobileParameters,
  render: ({ activePath }) => (
    <Frame theme="dark" dir="ltr" activePath={activePath} />
  ),
};

export const MobileDarkRtl: Story = {
  parameters: mobileParameters,
  render: ({ activePath }) => (
    <Frame theme="dark" dir="rtl" activePath={activePath} />
  ),
};

export const MobileMenuOpen: Story = {
  parameters: mobileParameters,
  args: { activePath: "/" },
  render: ({ activePath }) => (
    <Frame
      theme="light"
      dir="ltr"
      activePath={activePath}
      mobileNavDefaultOpen
    />
  ),
};
