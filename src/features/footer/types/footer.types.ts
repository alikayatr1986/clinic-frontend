import type { StaticImageData } from "next/image";

export interface LocalizedText {
  en: string;
  ar: string;
}

export interface SiteFooterConfig {
  phone?: string;
  email?: string;
  address?: LocalizedText;
  instagram?: string;
  whatsapp?: string;
  telegram?: string;
}

export interface SiteFooterProps {
  config: SiteFooterConfig;
}

export type FooterMessageKey =
  keyof (typeof import("../../../../messages/en.json"))["footer"];

export interface FooterLinkItem {
  labelKey: FooterMessageKey;
  href: string;
}

export interface FooterComingSoonItem {
  labelKey: FooterMessageKey;
}

export type FooterGroupKey = "explore" | "about" | "contact";

export interface FooterImageAsset {
  src: string | StaticImageData;
  width: number;
  height: number;
}

export interface SiteFooterConstants {
  logo: FooterImageAsset;
  channelIcons: {
    instagram: FooterImageAsset;
    whatsapp: FooterImageAsset;
    telegram: FooterImageAsset;
  };
  skyline: FooterImageAsset;
  exploreLinks: readonly FooterLinkItem[];
  aboutItems: readonly FooterLinkItem[];
  legalItems: readonly FooterComingSoonItem[];
}

export interface SiteFooterFrameProps {
  config: SiteFooterConfig;
  theme: "light" | "dark";
  dir: "ltr" | "rtl";
}

export interface SocialLinksProps {
  instagram?: string;
  whatsapp?: string;
  telegram?: string;
  layout: "desktop" | "mobile";
}

export interface SocialLinkProps {
  href: string;
  channel: "instagram" | "whatsapp" | "telegram";
}
