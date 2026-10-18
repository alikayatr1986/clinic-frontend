import type { Messages } from "next-intl";
export interface NavItem {
  readonly labelKey: keyof Messages["nav"];
  readonly href: string;
  readonly anchor?: string;
}
