import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Select } from "./select";
import { Label } from "./label";

const meta = {
  title: "UI/Select",
  component: Select,
  argTypes: {
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Label htmlFor="sb-select-default">Procedure</Label>
      <Select id="sb-select-default">
        <option value="">Select a procedure</option>
        <option value="rhinoplasty">Rhinoplasty</option>
        <option value="facelift">Facelift</option>
      </Select>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Label htmlFor="sb-select-disabled">Procedure</Label>
      <Select id="sb-select-disabled" disabled defaultValue="rhinoplasty">
        <option value="rhinoplasty">Rhinoplasty</option>
      </Select>
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Label htmlFor="sb-select-invalid">Procedure</Label>
      <Select
        id="sb-select-invalid"
        aria-invalid
        aria-describedby="sb-select-invalid-msg"
      >
        <option value="">Select a procedure</option>
        <option value="rhinoplasty">Rhinoplasty</option>
      </Select>
      <p id="sb-select-invalid-msg" role="alert" className="text-sm text-destructive">
        Please select an interested procedure.
      </p>
    </div>
  ),
};

export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl" lang="ar" className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="sb-select-rtl">الإجراء المطلوب</Label>
        <Select id="sb-select-rtl">
          <option value="">اختر إجراء</option>
          <option value="rhinoplasty">تجميل الأنف</option>
          <option value="facelift">شد الوجه</option>
        </Select>
      </div>
    </div>
  ),
};

