import footerLogo from "../assets/icons/footer-logo-white.png";
import telegramIcon from "../assets/icons/telegram-icon.png";
import whatsappIcon from "../assets/icons/whatsapp-icon.png";
import istanbulSkyline from "../assets/images/istanbul-skyline-with-galata-tower-image.png";

import type {
  FooterComingSoonItem,
  FooterLinkItem,
  SiteFooterConstants,
} from "@/features/footer/types/footer.types";

export const FOOTER_LOGO_IMAGE = {
  src: footerLogo,
  width: 1280,
  height: 326,
} as const;

export const CHANNEL_ICONS = {
  whatsapp: { src: whatsappIcon, width: 512, height: 512 },
  telegram: { src: telegramIcon, width: 512, height: 512 },
} as const;

export const FOOTER_SKYLINE_IMAGE = {
  src: istanbulSkyline,
  width: 2172,
  height: 724,
} as const;

export const EXPLORE_LINKS: readonly FooterLinkItem[] = [
  { labelKey: "exploreGallery", href: "/gallery" },
  { labelKey: "exploreBlog", href: "/blog" },
  { labelKey: "exploreContact", href: "#contact" },
];

export const ABOUT_ITEMS: readonly FooterLinkItem[] = [
  { labelKey: "aboutSurgeon", href: "/#contact" },
  { labelKey: "aboutFaq", href: "/#faq" },
];

export const LEGAL_ITEMS: readonly FooterComingSoonItem[] = [
  { labelKey: "legalPrivacy" },
  { labelKey: "legalTerms" },
  { labelKey: "legalNotice" },
];

export const FOOTER_CONSTANTS: SiteFooterConstants = {
  logo: FOOTER_LOGO_IMAGE,
  channelIcons: CHANNEL_ICONS,
  skyline: FOOTER_SKYLINE_IMAGE,
  exploreLinks: EXPLORE_LINKS,
  aboutItems: ABOUT_ITEMS,
  legalItems: LEGAL_ITEMS,
};
