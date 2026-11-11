import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SiteFooter } from "./SiteFooter";
import type {
  SiteFooterConfig,
  SiteFooterFrameProps,
} from "@/features/footer/types/footer.types";

const config: SiteFooterConfig = {
  phone: "+905551234567",
  email: "clinic@example.test",
  address: {
    en: "Nişantaşı, Istanbul, Türkiye",
    ar: "نيشانتاشي، إسطنبول، تركيا",
  },
  instagram: "https://www.instagram.com/naser.dadaszade.md/",
  whatsapp: "https://wa.me/905551234567",
  telegram: "https://t.me/exampleclinic",
};

const meta = {
  title: "Site/SiteFooter",
  component: SiteFooter,
  parameters: {
    layout: "fullscreen",
    chromatic: { viewports: [1024, 1280, 1440] },
  },
  args: { config },
} satisfies Meta<typeof SiteFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

function Frame({ config: frameConfig, theme, dir }: SiteFooterFrameProps) {
  return (
    <div
      dir={dir}
      lang={dir === "rtl" ? "ar" : "en"}
      className={theme === "dark" ? "dark" : undefined}
    >
      <SiteFooter config={frameConfig} />
    </div>
  );
}

export const LightLtr: Story = {
  render: ({ config: storyConfig }) => (
    <Frame config={storyConfig} theme="light" dir="ltr" />
  ),
};

export const LightRtl: Story = {
  render: ({ config: storyConfig }) => (
    <Frame config={storyConfig} theme="light" dir="rtl" />
  ),
};

export const DarkLtr: Story = {
  render: ({ config: storyConfig }) => (
    <Frame config={storyConfig} theme="dark" dir="ltr" />
  ),
};

export const DarkRtl: Story = {
  render: ({ config: storyConfig }) => (
    <Frame config={storyConfig} theme="dark" dir="rtl" />
  ),
};

export const SparseConfig: Story = {
  args: { config: {} },
  render: ({ config: storyConfig }) => (
    <Frame config={storyConfig} theme="light" dir="ltr" />
  ),
};

const mobile360Parameters = { chromatic: { viewports: [360] } };
const mobile390Parameters = { chromatic: { viewports: [390] } };
const mobile768Parameters = { chromatic: { viewports: [768] } };

export const Mobile360: Story = {
  parameters: mobile360Parameters,
  render: ({ config: storyConfig }) => (
    <Frame config={storyConfig} theme="light" dir="ltr" />
  ),
};

export const Mobile390: Story = {
  parameters: mobile390Parameters,
  render: ({ config: storyConfig }) => (
    <Frame config={storyConfig} theme="light" dir="ltr" />
  ),
};

export const Mobile768: Story = {
  parameters: mobile768Parameters,
  render: ({ config: storyConfig }) => (
    <Frame config={storyConfig} theme="light" dir="ltr" />
  ),
};

export const MobileSparse360: Story = {
  parameters: mobile360Parameters,
  args: { config: {} },
  render: ({ config: storyConfig }) => (
    <Frame config={storyConfig} theme="light" dir="ltr" />
  ),
};

export const MobileSparse390: Story = {
  parameters: mobile390Parameters,
  args: { config: {} },
  render: ({ config: storyConfig }) => (
    <Frame config={storyConfig} theme="light" dir="ltr" />
  ),
};

export const MobileSparse768: Story = {
  parameters: mobile768Parameters,
  args: { config: {} },
  render: ({ config: storyConfig }) => (
    <Frame config={storyConfig} theme="light" dir="ltr" />
  ),
};

export const MobileRtl390: Story = {
  parameters: mobile390Parameters,
  render: ({ config: storyConfig }) => (
    <Frame config={storyConfig} theme="light" dir="rtl" />
  ),
};
