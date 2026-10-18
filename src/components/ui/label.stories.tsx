import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Label } from "./label";
import { Input } from "./input";
const meta = {
  title: "UI/Label",
  component: Label,
  args: { children: "Full name" },
} satisfies Meta<typeof Label>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const WithInput: Story = {
  render: () => (<div className="flex w-full max-w-sm flex-col gap-2">
  <Label htmlFor="sb-label-input">Full name</Label>
  <Input id="sb-label-input" placeholder="e.g. Jane Smith"/>
  </div>),
};
export const DisabledPair: Story = {
  render: () => (<div className="flex w-full max-w-sm flex-col gap-2">
  <div className="flex items-center gap-3">
  <Input id="sb-label-off" disabled defaultValue="Unavailable"/>
  <Label htmlFor="sb-label-off">Accompanying label dims too</Label>
  </div>
  <p className="text-sm text-muted-foreground">
  The input carries peer so the label peer-dims when disabled.
  </p>
  </div>),
};
export const RightToLeft: Story = {
  render: () => (<div dir="rtl" lang="ar" className="flex w-full max-w-sm flex-col gap-2">
  <Label htmlFor="sb-label-rtl">الاسم الكامل</Label>
  <Input id="sb-label-rtl" placeholder="مثال: أحمد محمد"/>
  </div>),
};
