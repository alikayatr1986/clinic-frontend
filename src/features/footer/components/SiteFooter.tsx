import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowUpRight,
  ChevronDown,
  Images,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";

import { FOOTER_CONSTANTS } from "@/features/footer/constants/footer.constants";
import type {
  SiteFooterConfig,
  SiteFooterProps,
} from "@/features/footer/types/footer.types";
import { cn } from "@/lib/utils";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const GROUP_COLUMN = cn(
  "min-w-0 border-t border-white/10 pt-8",
  "lg:border-t-0 lg:border-s lg:border-white/10 lg:ps-4 lg:pt-0",
);

const LINK_ROW = cn(
  "flex min-h-12 items-center justify-between gap-3 rounded-sm py-2.5",
  "text-base text-linen/90 underline-offset-4",
  "hover:text-crimson-100 hover:underline",
  FOCUS_RING,
);

const CHANNEL_BUTTON = cn(
  "inline-flex min-h-12 flex-1 items-center gap-3 rounded-lg border border-white/15 bg-white/5 px-4",
  "text-base font-medium text-linen transition-colors motion-reduce:transition-none",
  "hover:border-white/25 hover:bg-white/10",
  FOCUS_RING,
);

const SUMMARY_ROW = cn(
  "flex min-h-16 cursor-pointer list-none items-center justify-between border-y border-white/10 py-4 text-linen outline-none",
  "[&::-webkit-details-marker]:hidden",
  FOCUS_RING,
);

const SUMMARY_CHEVRON = cn(
  "size-5 shrink-0 text-linen/80 transition-transform duration-200 motion-reduce:transition-none",
  "group-open:rotate-180 rtl:-rotate-90 rtl:group-open:rotate-90",
);

function clean(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function footerConfig({
  phone,
  email,
  address,
  whatsapp,
  telegram,
}: SiteFooterConfig = {}): SiteFooterConfig {
  const enAddress = clean(address?.en);
  const arAddress = clean(address?.ar);

  return {
    phone: clean(phone),
    email: clean(email),
    address:
      enAddress || arAddress
        ? {
            en: enAddress ?? arAddress!,
            ar: arAddress ?? enAddress!,
          }
        : undefined,
    whatsapp: clean(whatsapp),
    telegram: clean(telegram),
  };
}

export function SiteFooter({ config }: SiteFooterProps) {
  const t = useTranslations("footer");
  const locale = useLocale();
  const language = locale === "ar" ? "ar" : "en";
  const year = new Date().getFullYear();
  const { phone, email, address, whatsapp, telegram } = footerConfig(config);
  const addressText = address?.[language];
  const hasChannels = Boolean(whatsapp || telegram);
  const headingClass = cn(
    "text-3xl font-normal text-linen",
    language === "ar"
      ? "[font-family:var(--font-noto-arabic),sans-serif] leading-snug"
      : "font-hero-display",
  );
  const ruleClass = "mt-3 mb-6 block h-1 w-14 bg-crimson-600";

  return (
    <footer
      data-slot="site-footer"
      className="relative isolate overflow-hidden bg-midnight-950 text-linen"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-midnight-900 to-midnight-950"
      />

      <div
        data-slot="footer-arc-glow"
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -start-24 size-[380px] rounded-full blur-3xl bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--color-crimson-600)_35%,transparent)_0%,transparent_70%)]"
      />

      <div
        data-slot="footer-skyline"
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end overflow-hidden opacity-50 [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_35%)] [mask-image:linear-gradient(to_bottom,transparent_0%,black_35%)] lg:opacity-35"
      >
        <Image
          {...FOOTER_CONSTANTS.skyline}
          alt=""
          aria-hidden="true"
          sizes="100vw"
          className="h-[220px] w-full object-cover object-bottom lg:w-auto lg:max-w-none lg:object-contain lg:object-right-bottom rtl:lg:object-left-bottom"
        />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 xl:px-8">
        {/* Desktop Four-Column Composition (>=1024px) */}
        <div
          data-slot="site-footer-grid"
          className="hidden lg:grid lg:grid-cols-[2fr_1fr_1fr_1.4fr] lg:gap-12 lg:py-16"
        >
          <div data-slot="footer-brand" className="min-w-0">
            <Link
              href="/"
              className={cn("inline-flex min-h-12 items-center rounded-sm", FOCUS_RING)}
            >
              <Image
                {...FOOTER_CONSTANTS.logo}
                alt={t("logoAlt")}
                className="h-16 w-auto"
              />
            </Link>

            <p className="mt-5 max-w-[42ch] text-lg leading-[1.6] text-midnight-100">
              {t("tagline")}
            </p>

            <span
              aria-hidden="true"
              className="mt-6 block h-1 w-[72px] bg-crimson-600"
            />
          </div>

          <nav
            data-slot="footer-explore"
            aria-labelledby="footer-explore-heading"
            className={GROUP_COLUMN}
          >
            <h2 id="footer-explore-heading" className={headingClass}>
              {t("exploreTitle")}
            </h2>
            <span aria-hidden="true" className={ruleClass} />

            <ul className="space-y-1">
              {FOOTER_CONSTANTS.exploreLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={LINK_ROW}>
                    <span>{t(item.labelKey)}</span>
                    <ChevronDown
                      aria-hidden="true"
                      className="size-4 shrink-0 -rotate-90 rtl:rotate-90"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <section
            data-slot="footer-about"
            aria-labelledby="footer-about-heading"
            className={GROUP_COLUMN}
          >
            <h2 id="footer-about-heading" className={headingClass}>
              {t("aboutTitle")}
            </h2>
            <span aria-hidden="true" className={ruleClass} />

            <ul className="space-y-1">
              {FOOTER_CONSTANTS.aboutItems.map((item) => (
                <li
                  key={item.labelKey}
                  className="flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-2.5 text-base text-midnight-100"
                >
                  <span>{t(item.labelKey)}</span>
                  <span className="shrink-0 rounded-md border border-white/5 bg-white/10 px-2.5 py-1 text-xs font-medium text-linen">
                    {t("comingSoon")}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <nav
            data-slot="footer-contact"
            aria-labelledby="footer-contact-heading"
            className={GROUP_COLUMN}
          >
            <h2 id="footer-contact-heading" className={headingClass}>
              {t("contactTitle")}
            </h2>
            <span aria-hidden="true" className={ruleClass} />

            <ul className="space-y-3">
              {phone && (
                <li>
                  <a href={`tel:${phone}`} className={cn(LINK_ROW, "gap-3")}>
                    <span className="flex min-w-0 items-center gap-3">
                      <Phone
                        aria-hidden="true"
                        className="size-5 shrink-0 text-crimson-100"
                      />
                      <span className="min-w-0 break-words text-linen">
                        {phone}
                      </span>
                    </span>
                  </a>
                </li>
              )}

              {email && (
                <li>
                  <a href={`mailto:${email}`} className={cn(LINK_ROW, "gap-3")}>
                    <span className="flex min-w-0 items-center gap-3">
                      <Mail
                        aria-hidden="true"
                        className="size-5 shrink-0 text-crimson-100"
                      />
                      <span className="min-w-0 break-words text-linen">
                        {email}
                      </span>
                    </span>
                  </a>
                </li>
              )}

              <li className="flex items-start gap-3 py-2.5">
                <MapPin
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-crimson-100"
                />
                <span className="min-w-0">
                  <span className="block break-words text-base text-linen">
                    {addressText ?? t("addressFallback")}
                  </span>
                  {!addressText && (
                    <span className="mt-1 block text-sm text-midnight-200">
                      {t("addressNote")}
                    </span>
                  )}
                </span>
              </li>
            </ul>

            {hasChannels && (
              <div className="mt-6 flex flex-wrap gap-3">
                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={CHANNEL_BUTTON}
                  >
                    <Image
                      {...FOOTER_CONSTANTS.channelIcons.whatsapp}
                      alt=""
                      aria-hidden="true"
                      className="size-5 shrink-0"
                    />
                    <span className="min-w-0 flex-1">{t("whatsapp")}</span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 shrink-0 rtl:-scale-x-100"
                    />
                    <span className="sr-only"> {t("opensInNewTab")}</span>
                  </a>
                )}

                {telegram && (
                  <a
                    href={telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={CHANNEL_BUTTON}
                  >
                    <Image
                      {...FOOTER_CONSTANTS.channelIcons.telegram}
                      alt=""
                      aria-hidden="true"
                      className="size-5 shrink-0"
                    />
                    <span className="min-w-0 flex-1">{t("telegram")}</span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 shrink-0 rtl:-scale-x-100"
                    />
                    <span className="sr-only"> {t("opensInNewTab")}</span>
                  </a>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Mobile Disclosure Composition (<1024px) */}
        <div data-slot="site-footer-mobile" className="py-14 lg:hidden">
          <div data-slot="footer-brand-mobile" className="pb-8">
            <Link
              href="/"
              className={cn("inline-flex min-h-12 items-center rounded-sm", FOCUS_RING)}
            >
              <Image
                {...FOOTER_CONSTANTS.logo}
                alt={t("logoAlt")}
                className="h-16 w-auto"
              />
            </Link>

            <p className="mt-5 max-w-[42ch] text-base leading-[1.6] text-midnight-100">
              {t("tagline")}
            </p>

            <span
              aria-hidden="true"
              className="mt-6 block h-1 w-[72px] bg-crimson-600"
            />
          </div>

          <div data-slot="footer-mobile-disclosures" className="flex flex-col">
            {/* 1. Explore */}
            <details
              data-slot="footer-disclosure-explore"
              className="group -mt-px first:mt-0"
            >
              <summary
                data-slot="footer-summary-explore"
                className={SUMMARY_ROW}
              >
                <span className="flex items-center gap-3">
                  <Images
                    aria-hidden="true"
                    className="size-6 shrink-0 text-crimson-100"
                  />
                  <span className="text-lg font-semibold text-linen">
                    {t("exploreTitle")}
                  </span>
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={SUMMARY_CHEVRON}
                />
              </summary>
              <div data-slot="footer-panel-explore" className="py-4">
                <ul className="space-y-1">
                  {FOOTER_CONSTANTS.exploreLinks.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className={LINK_ROW}>
                        <span>{t(item.labelKey)}</span>
                        <ChevronDown
                          aria-hidden="true"
                          className="size-4 shrink-0 -rotate-90 rtl:rotate-90"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </details>

            {/* 2. About */}
            <details
              data-slot="footer-disclosure-about"
              className="group -mt-px first:mt-0"
            >
              <summary
                data-slot="footer-summary-about"
                className={SUMMARY_ROW}
              >
                <span className="flex items-center gap-3">
                  <User
                    aria-hidden="true"
                    className="size-6 shrink-0 text-crimson-100"
                  />
                  <span className="text-lg font-semibold text-linen">
                    {t("aboutTitle")}
                  </span>
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={SUMMARY_CHEVRON}
                />
              </summary>
              <div data-slot="footer-panel-about" className="py-4">
                <ul className="space-y-1">
                  {FOOTER_CONSTANTS.aboutItems.map((item) => (
                    <li
                      key={item.labelKey}
                      className="flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-2.5 text-base text-midnight-100"
                    >
                      <span>{t(item.labelKey)}</span>
                      <span className="shrink-0 rounded-md border border-white/5 bg-white/10 px-2.5 py-1 text-xs font-medium text-linen">
                        {t("comingSoon")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>

            {/* 3. Get in Touch (open by default) */}
            <details
              open
              data-slot="footer-disclosure-contact"
              className="group -mt-px first:mt-0"
            >
              <summary
                data-slot="footer-summary-contact"
                className={SUMMARY_ROW}
              >
                <span className="flex items-center gap-3">
                  <Phone
                    aria-hidden="true"
                    className="size-6 shrink-0 text-crimson-100"
                  />
                  <span className="text-lg font-semibold text-linen">
                    {t("contactTitle")}
                  </span>
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={SUMMARY_CHEVRON}
                />
              </summary>
              <div data-slot="footer-panel-contact" className="py-4">
                <ul className="space-y-3">
                  {phone && (
                    <li>
                      <a
                        href={`tel:${phone}`}
                        className={cn(
                          "flex min-h-12 max-w-[528px] items-center gap-3 rounded-sm py-1 text-base text-linen/90 underline-offset-4 hover:text-crimson-100 hover:underline",
                          FOCUS_RING,
                        )}
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
                          <Phone
                            aria-hidden="true"
                            className="size-5 text-crimson-100"
                          />
                        </span>
                        <span className="min-w-0 break-words text-linen">
                          {phone}
                        </span>
                      </a>
                    </li>
                  )}

                  {email && (
                    <li>
                      <a
                        href={`mailto:${email}`}
                        className={cn(
                          "flex min-h-12 max-w-[528px] items-center gap-3 rounded-sm py-1 text-base text-linen/90 underline-offset-4 hover:text-crimson-100 hover:underline",
                          FOCUS_RING,
                        )}
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
                          <Mail
                            aria-hidden="true"
                            className="size-5 text-crimson-100"
                          />
                        </span>
                        <span className="min-w-0 break-words text-linen">
                          {email}
                        </span>
                      </a>
                    </li>
                  )}

                  <li className="flex max-w-[528px] items-start gap-3 py-1">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
                      <MapPin
                        aria-hidden="true"
                        className="size-5 text-crimson-100"
                      />
                    </span>
                    <span className="min-w-0 pt-2">
                      <span className="block break-words text-base text-linen">
                        {addressText ?? t("addressFallback")}
                      </span>
                      {!addressText && (
                        <span className="mt-1 block text-sm text-midnight-200">
                          {t("addressNote")}
                        </span>
                      )}
                    </span>
                  </li>
                </ul>

                {hasChannels && (
                  <div className="mt-6 grid max-w-[528px] grid-cols-1 gap-3 min-[360px]:grid-cols-2">
                    {whatsapp && (
                      <a
                        href={whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={CHANNEL_BUTTON}
                      >
                        <Image
                          {...FOOTER_CONSTANTS.channelIcons.whatsapp}
                          alt=""
                          aria-hidden="true"
                          className="size-5 shrink-0"
                        />
                        <span className="min-w-0 flex-1">{t("whatsapp")}</span>
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-4 shrink-0 rtl:-scale-x-100"
                        />
                        <span className="sr-only"> {t("opensInNewTab")}</span>
                      </a>
                    )}

                    {telegram && (
                      <a
                        href={telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={CHANNEL_BUTTON}
                      >
                        <Image
                          {...FOOTER_CONSTANTS.channelIcons.telegram}
                          alt=""
                          aria-hidden="true"
                          className="size-5 shrink-0"
                        />
                        <span className="min-w-0 flex-1">{t("telegram")}</span>
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-4 shrink-0 rtl:-scale-x-100"
                        />
                        <span className="sr-only"> {t("opensInNewTab")}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </details>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div
          data-slot="footer-bottom"
          className="flex flex-col items-center gap-4 border-t border-white/10 py-7 text-center lg:flex-row lg:justify-between lg:gap-6 lg:text-start"
        >
          <p className="text-sm text-linen/80 lg:text-[15px]">
            {t("copyright", { year })}
          </p>

          <ul
            aria-label={t("legalTitle")}
            className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-linen/80 lg:text-[15px]"
          >
            {FOOTER_CONSTANTS.legalItems.map((item, index) => (
              <li key={item.labelKey} className="flex items-center gap-3">
                {index > 0 && (
                  <span aria-hidden="true" className="h-4 w-px bg-white/20" />
                )}
                <span>{t(item.labelKey)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
