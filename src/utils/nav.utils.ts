import type { NavItem } from "@/types/nav.types";

/**
 * Shared active-item matcher (single source for the desktop nav and the
 * mobile menu rows): an item is active when its href matches the location —
 * exactly for routes, by suffix for anchors (`/#treatments` marks
 * `#treatments` active).
 */
export function isActive(item: NavItem, activePath: string): boolean {
  if (item.href.startsWith("#")) {
    return activePath === item.href || activePath.endsWith(item.href);
  }
  return activePath === item.href;
}
