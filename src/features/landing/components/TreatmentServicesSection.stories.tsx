import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";

import { TreatmentServicesSection } from "./TreatmentServicesSection";
import arMessages from "../../../../messages/ar.json";

const meta = {
  title: "Site/TreatmentServicesSection",
  component: TreatmentServicesSection,
  parameters: { layout: "fullscreen" },
  render: () => <div className="-m-6"><TreatmentServicesSection /></div>,
} satisfies Meta<typeof TreatmentServicesSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DesktopEnglish: Story = {
  parameters: { chromatic: { viewports: [1024, 1440] } },
};

export const MobileEnglish: Story = {
  parameters: { chromatic: { viewports: [320, 390, 480, 481, 768, 1023] } },
};

export const Arabic: Story = {
  parameters: { chromatic: { viewports: [320, 390, 480, 481, 768, 1023, 1024, 1440] } },
  render: () => (
    <div className="-m-6" dir="rtl" lang="ar">
      <NextIntlClientProvider locale="ar" messages={arMessages}>
        <TreatmentServicesSection />
      </NextIntlClientProvider>
    </div>
  ),
};

export const DarkEnglish: Story = {
  globals: { theme: "dark" },
  parameters: { chromatic: { viewports: [320, 390, 480, 481, 768, 1023, 1024, 1440] } },
};

export const DarkArabic: Story = {
  ...Arabic,
  globals: { theme: "dark" },
};
