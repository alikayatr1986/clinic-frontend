import { ShieldPlus, UserRound, UsersRound } from "lucide-react";
import { getImageProps } from "next/image";
import desktopHeroImage from "../assets/images/hero-section-desktop-image.png";
import mobileHeroImage from "../assets/images/hero-section-mobile-image.png";

export const HERO_ARTWORK = {
  desktop: desktopHeroImage,
  mobile: mobileHeroImage,
} as const;

export const HERO_DESKTOP_MEDIA = "(min-width: 1024px)";

export const HERO_IMAGE_CONFIG = {
  alt: "",
  sizes: "100vw",
  loading: "eager",
  fetchPriority: "high",
} as const;

export const HERO_DESKTOP_IMAGE = getImageProps({
  ...HERO_IMAGE_CONFIG,
  ...HERO_ARTWORK.desktop,
}).props;

export const HERO_MOBILE_IMAGE = getImageProps({
  ...HERO_IMAGE_CONFIG,
  ...HERO_ARTWORK.mobile,
}).props;

export const HERO_ACTIONS = { primary: "#contact", secondary: "#treatments" } as const;

export const HERO_TRUST_ITEMS = [
  { key: "trustHospitals", icon: ShieldPlus },
  { key: "trustSpecialist", icon: UserRound },
  { key: "trustSupport", icon: UsersRound },
] as const;
