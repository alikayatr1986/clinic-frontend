import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";

import { HeroSection } from "./HeroSection";
import { withFallback } from "@/i18n/request";
import enMessages from "../../../../messages/en.json";
import arMessages from "../../../../messages/ar.json";

const meta = {
  title: "Site/HeroSection",
  component: HeroSection,
  parameters: { layout: "fullscreen" },
  render: () => <div className="-m-6"><HeroSection /></div>,
} satisfies Meta<typeof HeroSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DesktopEnglish: Story = {
  parameters: { chromatic: { viewports: [1986] } },
};

export const MobileEnglish: Story = {
  parameters: { chromatic: { viewports: [572, 390, 360] } },
};

export const TabletEnglish: Story = {
  parameters: { chromatic: { viewports: [768, 1024] } },
};

export const Arabic: Story = {
  parameters: { chromatic: { viewports: [390, 1440] } },
  render: () => (
    <div dir="rtl" lang="ar" className="-m-6">
      <NextIntlClientProvider locale="ar" messages={withFallback(enMessages, arMessages)}>
        <HeroSection />
      </NextIntlClientProvider>
    </div>
  ),
};

export const DarkEnglish: Story = {
  globals: { theme: "dark" },
  parameters: { chromatic: { viewports: [390, 1440] } },
};

export const DarkArabic: Story = {
  ...Arabic,
  globals: { theme: "dark" },
};

export const ActionsAndTrust: Story = {
  parameters: { chromatic: { viewports: [360, 572, 1024, 1986] } },
};
