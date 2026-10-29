import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createTranslator } from "next-intl";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";
import { themedRender } from "@/test/utils";
import ColorSmokePage from "./page";

vi.mock("next-intl/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next-intl/server")>()),
  getTranslations: vi.fn(async (options: string | { locale: "en" | "ar"; namespace: string }) => {
    const locale = typeof options === "string" ? "ar" : options.locale;
    return createTranslator({ locale, messages: locale === "ar" ? ar : en,
      namespace: "colorSmoke" });
  }),
}));

// Resolve the server preview components before rendering the page in jsdom.
async function resolvePreviews(node: ReactNode): Promise<ReactNode> {
  if (!isValidElement<{ children?: ReactNode; locale?: "en" | "ar" }>(node)) return node;
  if (typeof node.type === "function" && node.props.locale) {
    return (node.type as (props: { locale?: "en" | "ar" }) => Promise<ReactNode>)(node.props);
  }
  return cloneElement(node, {}, ...await Promise.all(Children.toArray(node.props.children).map(resolvePreviews)));
}

describe("ColorSmokePage", () => {
  it("translates page copy while retaining simultaneous English and Arabic previews", async () => {
    themedRender(<>{await resolvePreviews(await ColorSmokePage())}</>, { locale: "ar", dir: "rtl" });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(ar.colorSmoke.heading);
    expect(screen.getAllByRole("region", { name: en.colorSmoke.previewLabel })).toHaveLength(2);
    expect(screen.getAllByRole("region", { name: ar.colorSmoke.previewLabel })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: en.colorSmoke.consultation })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: ar.colorSmoke.consultation })).toHaveLength(2);
    expect(screen.getByText("midnight-950")).toBeInTheDocument();
  });
});
