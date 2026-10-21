import { ShieldPlus, UserRound, UsersRound } from "lucide-react";
import { getImageProps } from "next/image";

export const HERO_ARTWORK = {
  desktop: {
    src: "/images/landing/hero-section-desktop-image3.png",
    width: 1672,
    height: 941,
  },
  mobile: {
    src: "/images/landing/hero-section-mobile-image.png",
    width: 937,
    height: 1678,
  },
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
