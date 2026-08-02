import { describe, expect, it } from "vitest";

import { mockEvaluation } from "@/features/conversation/mock-conversation";

import {
  createSeedVocabulary,
  createVocabularyFromEvaluation,
  filterVocabulary,
  getVocabularyStatus,
} from "./vocabulary-data";

describe("vocabulary data", () => {
  const today = new Date(2026, 7, 3, 12);

  it("derives today, review, and mastered states", () => {
    const entries = createSeedVocabulary(today);
    expect(entries.map((entry) => getVocabularyStatus(entry, today))).toEqual([
      "today",
      "review",
      "mastered",
    ]);
  });

  it("filters saved phrases and localized search text", () => {
    const entries = createSeedVocabulary(today);
    expect(filterVocabulary(entries, "favorite", "", "en")).toHaveLength(1);
    expect(filterVocabulary(entries, "all", "随身", "zh-CN")[0].phrase).toBe(
      "carry-on bag",
    );
  });

  it("creates a real phrase from the conversation evaluation", () => {
    expect(
      createVocabularyFromEvaluation(
        "conversation-1",
        "scene-airport",
        mockEvaluation,
        today,
      ),
    ).toMatchObject({
      phrase: mockEvaluation.improved,
      meaning: mockEvaluation.reason,
      reviewCount: 0,
    });
  });
});
