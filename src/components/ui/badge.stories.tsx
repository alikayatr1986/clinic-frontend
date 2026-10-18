import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./badge";
const meta = {
  title: "UI/Badge",
  component: Badge,
  argTypes: {
  variant: {
  control: "select",
  options: ["default", "secondary", "midnight", "promo", "destructive", "outline"],
  },
  },
  args: { children: "UK" },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const AllVariants: Story = {
  render: () => (<div className="flex flex-wrap items-center gap-2">
  <Badge>UK</Badge>
  <Badge variant="secondary">DE · FUE</Badge>
  <Badge variant="midnight">UAE · 5 days</Badge>
  <Badge variant="promo">Promo −20%</Badge>
  <Badge variant="destructive">KSA</Badge>
  <Badge variant="outline">US</Badge>
  </div>),
};
export const RightToLeft: Story = {
  render: () => (<div dir="rtl" lang="ar" className="flex flex-wrap items-center gap-2">
  <Badge>الإمارات</Badge>
  <Badge variant="secondary">زراعة الشعر</Badge>
  <Badge variant="midnight">٥ أيام</Badge>
  <Badge variant="promo">خصم ٢٠٪</Badge>
  </div>),
};
