import { Globe, ShieldCheck, UserRound } from "lucide-react";

export const TREATMENT_SERVICES_ARTWORK = {
  desktop: {
    src: "/images/landing/treatment-and -services-desktop-image.png",
    width: 1774,
    height: 887,
  },
  mobile: {
    src: "/images/landing/treatment-and -services-mobile-image.png",
    width: 940,
    height: 1673,
  },
} as const;

export const TREATMENT_SERVICES_DOCTOR_MARK = {
  src: "/icons/landing/treatment-and-services/doctor-icon.png",
  width: 62,
  height: 62,
} as const;

export const TREATMENT_SERVICES = [
  { key: "rhinoplasty", image: { src: "/icons/landing/treatment-and-services/rhInoplastv-icon.png", width: 78, height: 76 } },
  { key: "ent", image: { src: "/icons/landing/treatment-and-services/ent-treatment-icon.png", width: 75, height: 75 } },
  { key: "rejuvenation", image: { src: "/icons/landing/treatment-and-services/facial-rejuvenation-icon.png", width: 843, height: 844 } },
  { key: "reconstructive", image: { src: "/icons/landing/treatment-and-services/functiona-reconstructive-surgery-icon.png", width: 75, height: 75 } },
] as const;

export const TREATMENT_SERVICES_ACTIONS = {
  primary: "#contact",
  secondary: "#contact",
} as const;

export const TREATMENT_SERVICES_TRUST = [
  { key: "hospitals", icon: ShieldCheck },
  { key: "specialist", icon: UserRound },
  { key: "concierge", icon: Globe },
] as const;
