import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axePass } from "@/test/utils";
import { ContactPhoneInput } from "./ContactPhoneInput";
import type { ContactCountry } from "../types/contact.types";

const mockCountries: ContactCountry[] = [
  { code: "tr", en: "Türkiye", ar: "تركيا", dialRegion: "TR" },
  { code: "us", en: "United States", ar: "الولايات المتحدة", dialRegion: "US" },
  { code: "unmapped", en: "Unmapped", ar: "غير متاح" },
];

describe("ContactPhoneInput", () => {
  it("renders with country dial code, flag, and input field", () => {
    const onChange = vi.fn();
    const onCountryChange = vi.fn();

    render(
      <ContactPhoneInput
        value=""
        countries={mockCountries}
        selectedDialCountry="tr"
        locale="en"
        onChange={onChange}
        onCountryChange={onCountryChange}
      />,
    );

    expect(screen.getByLabelText(/Phone country \/ dial code/)).toHaveValue("tr");
    expect(screen.getByText("+90")).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone number/)).toBeInTheDocument();
  });

  it("handles user typing and country selection changes", () => {
    const onChange = vi.fn();
    const onCountryChange = vi.fn();

    render(
      <ContactPhoneInput
        value="0532 111 2233"
        countries={mockCountries}
        selectedDialCountry="tr"
        locale="en"
        onChange={onChange}
        onCountryChange={onCountryChange}
      />,
    );

    const input = screen.getByLabelText(/Phone number/);
    expect(input).toHaveValue("0532 111 2233");

    fireEvent.change(input, { target: { value: "0532 999 8877" } });
    expect(onChange).toHaveBeenCalledWith("0532 999 8877");

    const select = screen.getByLabelText(/Phone country \/ dial code/);
    fireEvent.change(select, { target: { value: "us" } });
    expect(onCountryChange).toHaveBeenCalledWith("us");
  });

  it("applies error styling and accessibility attributes", async () => {
    const { container } = render(
      <ContactPhoneInput
        value=""
        countries={mockCountries}
        selectedDialCountry="tr"
        locale="en"
        hasError
        required
        ariaDescribedBy="test-error"
        onChange={vi.fn()}
        onCountryChange={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(/Phone number/);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "test-error");
    expect(input).toBeRequired();

    await axePass(container);
  });
});

