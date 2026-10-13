import type { Preview } from "@storybook/nextjs-vite";

import "../src/app/globals.css";
import "./storybook.css";

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
          <div className="min-h-[50vh] bg-background p-6 font-sans text-foreground antialiased">
            <Story />
          </div>
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
