import { describe, expect, it } from "vitest";
import arMessages from "../../messages/ar.json";
import enMessages from "../../messages/en.json";

const ICU_PLACEHOLDER = /\{([^{}]+)\}/g;

type MessageNode = { [key: string]: MessageNode | string };

function leafPaths(node: MessageNode, prefix = ""): string[] {
  return Object.entries(node).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : leafPaths(value, path);
  });
}

function placeholdersOf(node: MessageNode, path: string): string[] {
  let value = node as unknown;
  for (const segment of path.split(".")) {
    value = (value as MessageNode)[segment];
  }
  if (typeof value !== "string") {
    throw new Error(`Expected a string leaf at ${path}`);
  }

  return Array.from(value.matchAll(ICU_PLACEHOLDER), (match) => match[1]).sort();
}

describe("message files", () => {
  it("ar.json carries the exact key tree of en.json", () => {
    expect(leafPaths(arMessages).sort()).toEqual(leafPaths(enMessages).sort());
  });

  it("ICU placeholders stay in sync between en.json and ar.json", () => {
    for (const path of leafPaths(enMessages)) {
      expect(placeholdersOf(arMessages, path)).toEqual(placeholdersOf(enMessages, path));
    }
  });
});
