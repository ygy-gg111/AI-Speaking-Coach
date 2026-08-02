import { describe, expect, it } from "vitest";

import { createMistakeSchema, mistakeListQuerySchema } from "./server-contracts";

describe("mistake server contracts", () => {
  it("accepts a bilingual correction and supplies its default category", () => {
    expect(
      createMistakeSchema.parse({
        conversationId: "conversation-1",
        original: "I want go.",
        improved: "I want to go.",
        reason: { "zh-CN": "需要 to。", en: "Use to." },
      }),
    ).toMatchObject({ category: "expression" });
  });

  it("caps the requested list size", () => {
    expect(mistakeListQuerySchema.safeParse({ limit: 501 }).success).toBe(false);
  });
});
