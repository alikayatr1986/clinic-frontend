import { describe, expect, it, vi } from "vitest";

import arMessages from "../../messages/ar.json";
import enMessages from "../../messages/en.json";
import getConfig, { withFallback } from "./request";
import { routing } from "./routing";

vi.mock("next-intl/server", () => ({
  getRequestConfig: (callback: unknown) => callback,
}));

type RequestConfig = {
  locale: string;
  messages: typeof enMessages;
};

const runConfig = getConfig as unknown as (
  params: { requestLocale: Promise<string | undefined> },
) => Promise<RequestConfig>;

describe("i18n request config", () => {
  it("resolves a supported requested locale with its merged messages", async () => {
    const { locale, messages } = await runConfig({
      requestLocale: Promise.resolve("ar"),
    });

    expect(locale).toBe("ar");

    expect(messages.metadata.title).toBe(arMessages.metadata.title);
  });

  it("falls back to the default locale with the en messages when unsupported", async () => {
    const { locale, messages } = await runConfig({
      requestLocale: Promise.resolve("xx"),
    });

    expect(locale).toBe(routing.defaultLocale);
    expect(messages.metadata.title).toBe(enMessages.metadata.title);
  });

  it("coalesces an empty-string override leaf to the base value (E1)", () => {
    expect(withFallback({ leaf: "EN value" }, { leaf: "" })).toEqual({
      leaf: "EN value",
    });
  });
});