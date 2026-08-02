import { describe, expect, it } from "vitest";

import {
  createVocabularySchema,
  updateVocabularySchema,
} from "./server-contracts";

describe("vocabulary server contracts", () => {
  it("accepts a conversation-derived bilingual expression", () => {
    expect(
      createVocabularySchema.safeParse({
        conversationId: "conversation-1",
        phrase: "I want to go to Japan.",
        meaning: { "zh-CN": "自然表达", en: "A natural expression" },
        example: "I want to go to Japan.",
      }).success,
    ).toBe(true);
  });

  it("allows only supported review and favorite actions", () => {
    expect(updateVocabularySchema.safeParse({ action: "review" }).success).toBe(true);
    expect(
      updateVocabularySchema.safeParse({ action: "favorite", favorite: true })
        .success,
    ).toBe(true);
    expect(updateVocabularySchema.safeParse({ action: "delete" }).success).toBe(false);
  });
});
