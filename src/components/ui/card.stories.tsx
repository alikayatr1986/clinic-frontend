import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./button";
import { Badge } from "./badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "./card";

const meta = {
  title: "UI/Card",
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

function TreatmentCard({ rtl }: { rtl?: boolean }) {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>{rtl ? "زراعة الشعر" : "Hair transplant"}</CardTitle>
        <CardDescription>
          {rtl ? "٤٠٠٠+ بصيلة بتقنية FUE." : "4000+ grafts with FUE technique."}
        </CardDescription>
        <CardAction>
          <Badge variant="promo">-20%</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Badge>UK</Badge>
          <Badge variant="secondary">FUE</Badge>
          <Badge variant="midnight">5 {rtl ? "أيام" : "days"}</Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button>{rtl ? "احجز الاستشارة" : "Book consultation"}</Button>
      </CardFooter>
    </Card>
  );
}

export const Treatment: Story = {
  render: () => (
    <div dir="ltr" lang="en">
      <TreatmentCard />
    </div>
  ),
};

export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl" lang="ar">
      <TreatmentCard rtl />
    </div>
  ),
};
