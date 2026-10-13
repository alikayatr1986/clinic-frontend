import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "UI/Input",
  component: Input,
  argTypes: {
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
  args: { placeholder: "e.g. Jane Smith" },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Disabled value" },
};

export const Invalid: Story = {
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Label htmlFor="sb-input-invalid">Phone number</Label>
      <Input
        id="sb-input-invalid"
        defaultValue="123"
        aria-invalid
        aria-describedby="sb-input-invalid-msg"
      />
      <p id="sb-input-invalid-msg" role="alert" className="text-sm text-destructive">
        Please enter a valid phone number.
      </p>
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Label htmlFor="sb-input-name">Full name</Label>
      <Input id="sb-input-name" placeholder="e.g. Jane Smith" />
    </div>
  ),
};

export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl" lang="ar" className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="sb-input-rtl">الاسم الكامل</Label>
        <Input id="sb-input-rtl" placeholder="مثال: أحمد محمد" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sb-input-rtl-err">رقم الهاتف</Label>
        <Input
          id="sb-input-rtl-err"
          defaultValue="123"
          aria-invalid
          aria-describedby="sb-input-rtl-err-msg"
        />
        <p id="sb-input-rtl-err-msg" role="alert" className="text-sm text-destructive">
          يرجى إدخال رقم هاتف صحيح.
        </p>
      </div>
    </div>
  ),
};
