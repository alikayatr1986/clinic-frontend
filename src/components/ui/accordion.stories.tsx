import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";

const meta = {
  title: "UI/Accordion",
  component: Accordion,
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj;

const sampleItems = [
  {
    value: "surgical",
    trigger: "Surgical — sample question",
    content:
      "Sample answer for the surgical category placeholder. Replace with landing copy.",
  },
  {
    value: "logistics",
    trigger: "Logistics — sample question",
    content:
      "Sample answer for the logistics category placeholder. Replace with landing copy.",
  },
  {
    value: "safety",
    trigger: "Safety — sample question",
    content:
      "Sample answer for the safety category placeholder. Replace with landing copy.",
  },
];

function SampleAccordion({
  defaultValue,
  disabledIndex,
}: {
  defaultValue?: string;
  disabledIndex?: number;
}) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultValue}
      className="w-full max-w-md"
    >
      {sampleItems.map((item, index) => (
        <AccordionItem key={item.value} value={item.value}>
          <AccordionTrigger disabled={index === disabledIndex}>
            {item.trigger}
          </AccordionTrigger>
          <AccordionContent>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export const Default: Story = {
  render: () => (
    <div dir="ltr" lang="en">
      <SampleAccordion />
    </div>
  ),
};

export const OpenState: Story = {
  render: () => (
    <div dir="ltr" lang="en">
      <SampleAccordion defaultValue="surgical" />
    </div>
  ),
};

export const DisabledTrigger: Story = {
  render: () => (
    <div dir="ltr" lang="en">
      <SampleAccordion disabledIndex={1} />
    </div>
  ),
};

export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl" lang="ar" className="w-full max-w-md">
      <Accordion type="single" collapsible defaultValue="safety">
        <AccordionItem value="surgical">
          <AccordionTrigger>جراحي — سؤال تجريبي</AccordionTrigger>
          <AccordionContent>إجابة تجريبية لعنصر الجراحة.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="logistics">
          <AccordionTrigger>لوجستي — سؤال تجريبي</AccordionTrigger>
          <AccordionContent>إجابة تجريبية لعنصر اللوجستيات.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="safety">
          <AccordionTrigger>سلامة — سؤال تجريبي</AccordionTrigger>
          <AccordionContent>إجابة تجريبية لعنصر السلامة.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const Dark: Story = {
  render: () => (
    <div className="dark bg-background p-6" dir="ltr" lang="en">
      <SampleAccordion defaultValue="logistics" />
    </div>
  ),
};
