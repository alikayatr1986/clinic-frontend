import type { NavItem } from "@/types/nav.types";
export function isActive(item: NavItem, activePath: string): boolean {
  if (item.href.startsWith("#")) {
  return activePath === item.href || activePath.endsWith(item.href);
  }
  return activePath === item.href;
}
