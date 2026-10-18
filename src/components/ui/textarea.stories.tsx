import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Textarea } from "./textarea";
import { Label } from "./label";
const LONG_TEXT = `Line 01 of a very long patient note that must exceed the cap.
Line 02 continues the story past comfortable reading.
Line 03 keeps going; the box should stop growing soon.
Line 04 approaches the max-h-96 ceiling of 384 pixels.
Line 05 crosses the ceiling — from here the box must scroll.
Line 06 must be reachable only by scrolling inside the box.
Line 07 confirms the page layout does not stretch further.
Line 08 extra content for the scroll region.
Line 09 extra content for the scroll region.
Line 10 extra content for the scroll region.
Line 11 extra content for the scroll region.
Line 12 final line, visible only after scrolling.`;
const meta = {
  title: "UI/Textarea",
  component: Textarea,
  args: { placeholder: "Notes (optional)" },
} satisfies Meta<typeof Textarea>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const LongContent: Story = {
  render: () => (<div className="flex w-full max-w-sm flex-col gap-2">
  <Label htmlFor="sb-textarea-long">Notes</Label>
  <Textarea id="sb-textarea-long" defaultValue={LONG_TEXT} rows={3}/>
  <p className="text-sm text-muted-foreground">
  Growth caps at max-h-96, then scrolls.
  </p>
  </div>),
};
export const Invalid: Story = {
  render: () => (<div className="flex w-full max-w-sm flex-col gap-2">
  <Label htmlFor="sb-textarea-invalid">Medical history</Label>
  <Textarea id="sb-textarea-invalid" aria-invalid aria-describedby="sb-textarea-invalid-msg" placeholder="Required"/>
  <p id="sb-textarea-invalid-msg" role="alert" className="text-sm text-destructive">
  Please describe any relevant conditions.
  </p>
  </div>),
};
export const RightToLeft: Story = {
  render: () => (<div dir="rtl" lang="ar" className="flex w-full max-w-sm flex-col gap-2">
  <Label htmlFor="sb-textarea-rtl">ملاحظات</Label>
  <Textarea id="sb-textarea-rtl" defaultValue="سطر أول من ملاحظة طويلة للمريض. سطر ثانٍ يستمر." rows={3}/>
  </div>),
};
