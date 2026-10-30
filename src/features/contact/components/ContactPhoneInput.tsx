"use client";

import * as React from "react";
import flags from "react-phone-number-input/flags";
import { getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContactPhoneInputProps } from "../types/contact.types";

function safeCallingCode(region?: CountryCode): string | null {
  if (!region) return null;
  try {
    return getCountryCallingCode(region);
  } catch {
    return null;
  }
}

export function ContactPhoneInput({
  id = "contact-phone",
  name = "phone",
  value,
  country,
  defaultCountry,
  countries,
  selectedDialCountry,
  disabled,
  required,
  hasError,
  locale,
  selectCountryLabel,
  countryAriaLabel = "Phone country / dial code",
  inputAriaLabel = "Phone number",
  ariaDescribedBy,
  onChange,
  onCountryChange,
}: ContactPhoneInputProps) {
  const activeCode =
    selectedDialCountry ||
    countries.find((c) => {
      return c.dialRegion === country;
    })?.code ||
    "";
  const activeCountry = countries.find((c) => {
    return c.code === activeCode;
  });
  const activeRegion = activeCountry?.dialRegion || country || defaultCountry;

  const Flag = activeRegion ? flags[activeRegion] : undefined;
  const callingCode = safeCallingCode(activeRegion);

  return (
    <div
      className={cn(
        "relative flex min-h-12 w-full min-w-0 items-stretch rounded-md border border-input bg-card shadow-sm transition-colors",
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring",
        hasError && "border-destructive ring-2 ring-destructive/30",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <div className="relative flex items-center gap-1.5 border-e border-input/60 bg-muted/20 px-3 py-2 transition-colors focus-within:bg-muted/40">
        <div className="flex items-center gap-1.5 pointer-events-none select-none">
          {Flag ? (
            <span className="flex h-3.5 w-5 overflow-hidden rounded-xs border border-border/40 shadow-2xs">
              <Flag
                title={
                  activeCountry
                    ? locale === "ar"
                      ? activeCountry.ar
                      : activeCountry.en
                    : ""
                }
              />
            </span>
          ) : (
            <span className="h-3.5 w-5 rounded-xs bg-muted border border-border/40" />
          )}
          {callingCode ? (
            <span
              className="text-sm font-medium text-muted-foreground"
              dir="ltr"
            >
              +{callingCode}
            </span>
          ) : null}
          <ChevronDown
            className="size-3.5 text-muted-foreground opacity-60"
            aria-hidden="true"
          />
        </div>
        <select
          id="contact-dial_country"
          name="dial_country"
          aria-label={countryAriaLabel}
          aria-invalid={hasError}
          aria-describedby={ariaDescribedBy}
          className="absolute inset-0 size-full cursor-pointer opacity-0 focus-visible:outline-none disabled:cursor-not-allowed"
          value={activeCode}
          disabled={disabled}
          onChange={(event) => onCountryChange(event.target.value)}
        >
          <option value="">
            {selectCountryLabel ||
              (locale === "ar" ? "اختر الدولة" : "Select phone country")}
          </option>
          {countries.map((item) => {
            const dial = item.dialRegion
              ? ` (+${safeCallingCode(item.dialRegion) || ""})`
              : "";
            const label = (locale === "ar" ? item.ar : item.en) + dial;
            return (
              <option key={item.code} value={item.code}>
                {label}
              </option>
            );
          })}
        </select>
      </div>

      <input
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        maxLength={64}
        dir="ltr"
        required={required}
        aria-label={inputAriaLabel}
        aria-invalid={hasError}
        aria-describedby={ariaDescribedBy}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-full flex-1 min-w-0 bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground outline-none border-0 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
