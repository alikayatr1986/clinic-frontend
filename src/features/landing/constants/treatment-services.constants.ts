import { Globe, ShieldCheck, UserRound } from "lucide-react";
import doctorIcon from "../assets/icons/treatment-services/doctor-icon.png";
import entTreatmentIcon from "../assets/icons/treatment-services/ent-treatment-icon.png";
import facialRejuvenationIcon from "../assets/icons/treatment-services/facial-rejuvenation-icon.png";
import reconstructiveSurgeryIcon from "../assets/icons/treatment-services/functiona-reconstructive-surgery-icon.png";
import rhinoplastyIcon from "../assets/icons/treatment-services/rhInoplastv-icon.png";
import desktopArtwork from "../assets/images/treatment-services-desktop-image.png";
import mobileArtwork from "../assets/images/treatment-services-mobile-image.png";

export const TREATMENT_SERVICES_ARTWORK = {
  desktop: desktopArtwork,
  mobile: mobileArtwork,
} as const;

export const TREATMENT_SERVICES_DOCTOR_MARK = {
  src: doctorIcon,
  width: 62,
  height: 62,
} as const;

export const TREATMENT_SERVICES = [
  { key: "rhinoplasty", image: { src: rhinoplastyIcon, width: 78, height: 76 } },
  { key: "ent", image: { src: entTreatmentIcon, width: 75, height: 75 } },
  { key: "rejuvenation", image: { src: facialRejuvenationIcon, width: 843, height: 844 } },
  { key: "reconstructive", image: { src: reconstructiveSurgeryIcon, width: 75, height: 75 } },
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
