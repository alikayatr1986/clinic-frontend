import boardCertificateIcon from "../assets/icons/why-turkey/board-certificate-icon.png";
import internationalPatientSupportIcon from "../assets/icons/why-turkey/international-patient-support.png";
import isoIcon from "../assets/icons/why-turkey/ISO-icon.png";
import jciIcon from "../assets/icons/why-turkey/JCI-icon.png";
import ministryOfHealthIcon from "../assets/icons/why-turkey/ministery-of-health-icon.png";
import hospitalSampleImage from "../assets/images/why-turkey-hospital-sample-image.png";

export const WHY_TURKEY_CERTIFICATE_MARKS = [
  {
    src: jciIcon,
    width: 63,
    height: 62,
    labelKey: "markJci",
  },
  {
    src: isoIcon,
    width: 51,
    height: 55,
    labelKey: "markIso",
  },
  {
    src: ministryOfHealthIcon,
    width: 54,
    height: 52,
    labelKey: "markMinistry",
  },
] as const;

export const WHY_TURKEY_TRUST_MARKS = {
  specialist: { src: boardCertificateIcon, width: 68, height: 61 },
  support: { src: internationalPatientSupportIcon, width: 65, height: 65 },
} as const;

export const WHY_TURKEY_HOSPITAL_IMAGE = {
  src: hospitalSampleImage,
  width: 156,
  height: 113,
} as const;

