import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./button";

const meta = {
  title: "UI/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "ghost", "destructive", "link"],
    },
    size: { control: "select", options: ["default", "sm", "lg", "icon"] },
    disabled: { control: "boolean" },
    asChild: { table: { disable: true } },
  },
  args: { children: "Book consultation" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["default", "secondary", "ghost", "destructive", "link"] as const).map(
        (variant) => (
          <div key={variant} className="flex flex-wrap items-center gap-3">
            <span className="w-24 text-sm text-muted-foreground">{variant}</span>
            <Button variant={variant}>Default</Button>
            <Button variant={variant} size="sm">
              Small
            </Button>
            <Button variant={variant} size="lg">
              Large
            </Button>
            <Button variant={variant} disabled>
              Disabled
            </Button>
          </div>
        )
      )}
    </div>
  ),
};

/** Hero-critical EN/AR dual-CTA pairing: crimson consultation CTA plus midnight-outline discount CTA. */
export const DualCTA: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div dir="ltr" lang="en" className="flex flex-col gap-3 sm:flex-row">
        <Button>Book consultation</Button>
        <Button variant="secondary">Discount Club</Button>
      </div>
      <div dir="rtl" lang="ar" className="flex flex-col gap-3 sm:flex-row">
        <Button>احجز الاستشارة</Button>
        <Button variant="secondary">نادي الخصومات</Button>
      </div>
    </div>
  ),
};

export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl" lang="ar" className="flex flex-wrap items-center gap-3">
      <Button>احجز الاستشارة</Button>
      <Button variant="secondary">نادي الخصومات</Button>
      <Button variant="ghost">اعرف المزيد</Button>
      <Button disabled>معطل</Button>
    </div>
  ),
};
