import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

const meta = {
  title: "UI/Sheet",
  component: Sheet,
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

function NavLinks({ rtl }: { rtl?: boolean }) {
  return (
    <nav className="flex flex-col gap-1 p-4">
      {rtl
        ? ["الرئيسية", "العلاجات", "الأسئلة", "تواصل"].map((label) => (
            <Button key={label} variant="ghost" className="justify-start">
              {label}
            </Button>
          ))
        : ["Home", "Treatments", "FAQ", "Contact"].map((label) => (
            <Button key={label} variant="ghost" className="justify-start">
              {label}
            </Button>
          ))}
    </nav>
  );
}

export const Default: Story = {
  render: () => (
    <div dir="ltr" lang="en">
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open menu</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Mobile navigation drawer.</SheetDescription>
          </SheetHeader>
          <NavLinks />
        </SheetContent>
      </Sheet>
    </div>
  ),
};

export const AllSides: Story = {
  render: () => (
    <div dir="ltr" lang="en" className="flex flex-wrap gap-3">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Sheet key={side}>
          <SheetTrigger asChild>
            <Button variant="secondary">{side}</Button>
          </SheetTrigger>
          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>{side} sheet</SheetTitle>
              <SheetDescription>Slides from the {side} edge.</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose asChild>
                <Button>Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  ),
};

export const OpenState: Story = {
  render: () => (
    <div dir="ltr" lang="en">
      <Sheet defaultOpen>
        <SheetTrigger asChild>
          <Button>Open menu</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Mobile navigation drawer.</SheetDescription>
          </SheetHeader>
          <NavLinks />
        </SheetContent>
      </Sheet>
    </div>
  ),
};

export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl" lang="ar">
      <Sheet defaultOpen>
        <SheetTrigger asChild>
          <Button>افتح القائمة</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>القائمة</SheetTitle>
            <SheetDescription>درج التنقل للجوال.</SheetDescription>
          </SheetHeader>
          <NavLinks rtl />
        </SheetContent>
      </Sheet>
    </div>
  ),
};

export const Dark: Story = {
  render: () => (
    <div className="dark bg-background p-6" dir="ltr" lang="en">
      <Sheet defaultOpen>
        <SheetTrigger asChild>
          <Button>Open menu</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>
              Same midnight overlay under the dark theme.
            </SheetDescription>
          </SheetHeader>
          <NavLinks />
        </SheetContent>
      </Sheet>
    </div>
  ),
};
