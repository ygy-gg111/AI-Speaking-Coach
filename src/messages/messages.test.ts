import { describe, expect, it } from "vitest";

import en from "./en.json";
import zhCN from "./zh-CN.json";

function collectKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    collectKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("translations", () => {
  it("keeps Chinese and English message keys aligned", () => {
    expect(collectKeys(zhCN).sort()).toEqual(collectKeys(en).sort());
  });
});
