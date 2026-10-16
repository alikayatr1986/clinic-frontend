import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuCheckIcon,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const meta = {
  title: "UI/DropdownMenu",
  component: DropdownMenu,
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" },
];

function Languages({ dark }: { dark?: boolean }) {
  return (
    <div className={(dark ? "dark bg-background " : "") + "p-6"} dir="ltr" lang="en">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Change language</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {LANGUAGES.map((language) => (
            <DropdownMenuItem key={language.code} data-lang={language.code}>
              {language.label}
              {language.code === "en" && (
                <DropdownMenuCheckIcon className="absolute end-2" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <div dir="ltr" lang="en">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Change language</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {LANGUAGES.map((language) => (
            <DropdownMenuItem key={language.code} data-lang={language.code}>
              {language.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
};

export const OpenState: Story = {
  render: () => <Languages />,
};

export const RightToLeft: Story = {
  render: () => <Languages />,
};

export const Dark: Story = {
  render: () => <Languages dark />,
};
