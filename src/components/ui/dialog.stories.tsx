import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "./dialog";
const meta = {
  title: "UI/Dialog",
  component: Dialog,
} satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: () => (<div dir="ltr" lang="en">
  <Dialog>
  <DialogTrigger asChild>
  <Button>Book consultation</Button>
  </DialogTrigger>
  <DialogContent>
  <DialogHeader>
  <DialogTitle>Confirm consultation</DialogTitle>
  <DialogDescription>
  Sample confirm copy. Replace with landing flow text.
  </DialogDescription>
  </DialogHeader>
  <DialogFooter>
  <DialogClose asChild>
  <Button>Confirm</Button>
  </DialogClose>
  </DialogFooter>
  </DialogContent>
  </Dialog>
  </div>),
};
export const OpenState: Story = {
  render: () => (<div dir="ltr" lang="en">
  <Dialog defaultOpen>
  <DialogTrigger asChild>
  <Button>Book consultation</Button>
  </DialogTrigger>
  <DialogContent>
  <DialogHeader>
  <DialogTitle>Confirm consultation</DialogTitle>
  <DialogDescription>
  Sample confirm copy. Replace with landing flow text.
  </DialogDescription>
  </DialogHeader>
  <DialogFooter>
  <DialogClose asChild>
  <Button>Confirm</Button>
  </DialogClose>
  </DialogFooter>
  </DialogContent>
  </Dialog>
  </div>),
};
export const WithConsultationForm: Story = {
  render: () => (<div dir="ltr" lang="en">
  <Dialog defaultOpen>
  <DialogTrigger asChild>
  <Button>Book consultation</Button>
  </DialogTrigger>
  <DialogContent>
  <DialogHeader>
  <DialogTitle>Confirm consultation</DialogTitle>
  <DialogDescription>
  Reuses story-2 controls only; no new form primitives.
  </DialogDescription>
  </DialogHeader>
  <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
  <div className="flex flex-col gap-2">
  <Label htmlFor="sb-dialog-name">Full name</Label>
  <Input id="sb-dialog-name" placeholder="e.g. Jane Smith"/>
  </div>
  <DialogFooter>
  <DialogClose asChild>
  <Button type="submit">Confirm</Button>
  </DialogClose>
  </DialogFooter>
  </form>
  </DialogContent>
  </Dialog>
  </div>),
};
export const DisabledTrigger: Story = {
  render: () => (<div dir="ltr" lang="en">
  <Dialog>
  <DialogTrigger asChild>
  <Button disabled>Book consultation</Button>
  </DialogTrigger>
  <DialogContent>
  <DialogHeader>
  <DialogTitle>Confirm consultation</DialogTitle>
  <DialogDescription>Disabled trigger never opens.</DialogDescription>
  </DialogHeader>
  </DialogContent>
  </Dialog>
  </div>),
};
export const RightToLeft: Story = {
  render: () => (<div dir="rtl" lang="ar">
  <Dialog defaultOpen>
  <DialogTrigger asChild>
  <Button>احجز الاستشارة</Button>
  </DialogTrigger>
  <DialogContent>
  <DialogHeader>
  <DialogTitle>تأكيد الاستشارة</DialogTitle>
  <DialogDescription>نص تجريبي لتدفق التأكيد.</DialogDescription>
  </DialogHeader>
  <DialogFooter>
  <DialogClose asChild>
  <Button>تأكيد</Button>
  </DialogClose>
  </DialogFooter>
  </DialogContent>
  </Dialog>
  </div>),
};
export const Dark: Story = {
  render: () => (<div className="dark bg-background p-6" dir="ltr" lang="en">
  <Dialog defaultOpen>
  <DialogTrigger asChild>
  <Button>Book consultation</Button>
  </DialogTrigger>
  <DialogContent>
  <DialogHeader>
  <DialogTitle>Confirm consultation</DialogTitle>
  <DialogDescription>
  Same midnight overlay under the dark theme.
  </DialogDescription>
  </DialogHeader>
  <DialogFooter>
  <DialogClose asChild>
  <Button>Confirm</Button>
  </DialogClose>
  </DialogFooter>
  </DialogContent>
  </Dialog>
  </div>),
};
