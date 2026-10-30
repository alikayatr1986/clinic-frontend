import * as React from "react";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "@/components/ui/select";
import { axePass, themedRender } from "@/test/utils";

describe("Select", () => {
  it("renders smoke with options and chevron icon", () => {
    themedRender(
      <Select aria-label="Procedure">
        <option value="">Select a procedure</option>
        <option value="rhinoplasty">Rhinoplasty</option>
      </Select>,
    );
    expect(screen.getByLabelText("Procedure")).toBeInTheDocument();
  });

  it("carries base semantic classes and end-2 chevron placement", () => {
    const { container } = themedRender(
      <Select aria-label="Procedure">
        <option value="">Select a procedure</option>
      </Select>,
    );
    const select = container.querySelector("select");
    expect(select).toHaveClass("border-input");
    expect(select).toHaveClass("appearance-none");
    expect(select).toHaveClass("pe-8");
    expect(select).toHaveClass("h-12");

    const chevron = container.querySelector("svg");
    expect(chevron).toBeInTheDocument();
    expect(chevron).toHaveClass("end-2");
    expect(chevron).toHaveClass("pointer-events-none");
  });

  it("exposes the invalid-state rule classes", () => {
    const { container } = themedRender(
      <Select aria-label="Procedure" aria-invalid>
        <option value="">Select a procedure</option>
      </Select>,
    );
    const select = container.querySelector("select");
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select?.className).toContain("aria-invalid:border-destructive");
  });

  it("supports keyboard selection", async () => {
    const user = userEvent.setup();
    themedRender(
      <Select aria-label="Procedure">
        <option value="">Select a procedure</option>
        <option value="rhinoplasty">Rhinoplasty</option>
      </Select>,
    );
    const select = screen.getByLabelText("Procedure");
    await user.selectOptions(select, "rhinoplasty");
    expect(select).toHaveValue("rhinoplasty");
  });

  it("marks disabled with attribute and opacity class", () => {
    const { container } = themedRender(
      <Select aria-label="Procedure" disabled>
        <option value="">Select a procedure</option>
      </Select>,
    );
    const select = container.querySelector("select");
    expect(select).toBeDisabled();
    expect(select?.className).toContain("disabled:opacity-50");
  });

  it("passes axe accessibility in Light LTR and Dark RTL", async () => {
    const ltr = themedRender(
      <Select aria-label="Procedure">
        <option value="">Select a procedure</option>
        <option value="rhinoplasty">Rhinoplasty</option>
      </Select>,
      { dir: "ltr", lang: "en" },
    );
    await axePass(ltr.container);
    ltr.unmount();

    const rtl = themedRender(
      <Select aria-label="الإجراء">
        <option value="">اختر إجراء</option>
        <option value="rhinoplasty">تجميل الأنف</option>
      </Select>,
      { dir: "rtl", lang: "ar", theme: "dark" },
    );
    await axePass(rtl.container);
  });
});

