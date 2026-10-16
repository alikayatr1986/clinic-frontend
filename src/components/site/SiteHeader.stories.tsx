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

/**
 * Desktop row is `hidden lg:flex`, so it renders once the Storybook canvas is
 * >=1024px wide (the desktop mock breakpoint); below that only the mobile row
 * shows.
 */
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

/** Section item active via `activePath` to exercise the crimson underline. */
export const SectionActive: Story = {
  args: { activePath: "/#treatments" },
  render: ({ activePath }) => (
    <Frame theme="light" dir="ltr" activePath={activePath} />
  ),
};

/**
 * Mobile-row stories. The `lg` breakpoint is evaluated against the Storybook
 * canvas, so the mobile row (like the wordmark in the desktop stories above)
 * renders locally only while the canvas is narrower than 1024px; the
 * `chromatic.viewports` pin prepares the 390px mobile-mock capture for a
 * future Chromatic run (no Chromatic CLI/CI is wired in this repo yet).
 * Menu-open uses the `mobileNavDefaultOpen`
 * story hook so the panel state is deterministic without a play interaction.
 */
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

/** Mobile row with the right slide-in menu panel open (7 links + CTA). */
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
