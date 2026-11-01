import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { FaqSection } from "./FaqSection";
import { axePass, themedRender } from "@/test/utils";
import enMessages from "../../../../messages/en.json";
import arMessages from "../../../../messages/ar.json";

describe("FaqSection", () => {
  it.each([
    ["en", enMessages.faqSection],
    ["ar", arMessages.faqSection],
  ] as const)("renders and operates the disclosure in %s", async (locale, messages) => {
    const { container } = themedRender(<FaqSection />, { locale });
    expect(screen.getByText(messages.provisional)).toBeVisible();
    const first = screen.getByRole("button", { name: messages.question1 });
    const second = screen.getByRole("button", { name: messages.question2 });
    expect(screen.getAllByRole("button")).toHaveLength(6);
    for (const question of [messages.question1, messages.question2, messages.question3, messages.question4, messages.question5, messages.question6]) {
      expect(screen.getByRole("button", { name: question })).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: locale === "ar" ? arMessages.header.cta : enMessages.header.cta })).toHaveAttribute("href", "#contact");
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(first.getAttribute("aria-controls")!)).toHaveTextContent(messages.answer);
    expect(screen.getByRole("region", { name: messages.heading })).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    await userEvent.click(second);
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(second.getAttribute("aria-controls")!)).toHaveTextContent(messages.answer);
    second.focus();
    await userEvent.keyboard("{Enter}");
    expect(second).toHaveAttribute("aria-expanded", "false");
    await axePass(container);
  });
});
