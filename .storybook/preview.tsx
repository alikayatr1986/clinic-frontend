import type { Preview } from "@storybook/nextjs-vite";

import { NextIntlClientProvider } from "next-intl";

import "../src/app/globals.css";
import "./storybook.css";

import enMessages from "../messages/en.json";

export const globalTypes = {
  theme: {
    name: "Theme",
    description: "Color mode (class-based .dark)",
    defaultValue: "light",
    toolbar: {
      icon: "circlehollow",
      items: [
        { value: "light", title: "Light" },
        { value: "dark", title: "Dark" },
      ],
      dynamicTitle: true,
    },
  },
  direction: {
    name: "Direction",
    description: "Text direction (RTL also switches lang for shaping)",
    defaultValue: "ltr",
    toolbar: {
      icon: "transfer",
      items: [
        { value: "ltr", title: "LTR" },
        { value: "rtl", title: "RTL" },
      ],
      dynamicTitle: true,
    },
  },
};

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme ?? "light";
      const dir = context.globals.direction ?? "ltr";
      return (
        <div
          dir={dir}
          lang={dir === "rtl" ? "ar" : "en"}
          className={theme === "dark" ? "dark" : undefined}
        >
          {/* Story 4 (spec-frontend-i18n-rtl): static EN provider so
              localized ui surfaces (Close buttons, nav labels) render
              unlinked — stories' own Arabic/dev-only literals stay. */}
          <NextIntlClientProvider locale="en" messages={enMessages}>
            <div className="min-h-[50vh] bg-background p-6 font-sans text-foreground antialiased">
              <Story />
            </div>
          </NextIntlClientProvider>
        </div>
      );
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  tags: ["autodocs"],
};

export default preview;
