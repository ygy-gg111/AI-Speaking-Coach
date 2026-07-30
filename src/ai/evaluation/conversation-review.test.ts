import { describe, expect, it } from "vitest";

import {
  buildConversationReviewPrompt,
  createFallbackEvaluation,
} from "./conversation-review";

describe("conversation review", () => {
  it("corrects a common want/go expression in fallback mode", () => {
    const evaluation = createFallbackEvaluation({
      learnerLevel: "A2",
      durationSeconds: 125,
      messages: [{ role: "user", text: "I want go Japan." }],
    });

    expect(evaluation.improved).toBe("I want to go to Japan.");
    expect(evaluation.corrections).toBe(1);
    expect(evaluation.durationMinutes).toBe(3);
  });

  it("builds a bounded scene-aware review prompt", () => {
    const prompt = buildConversationReviewPrompt({
      sceneName: "Airport Check-in",
      learnerLevel: "A2",
      messages: [{ role: "user", text: "I want go Japan." }],
    });

    expect(prompt).toContain("Airport Check-in");
    expect(prompt).toContain("CEFR level: A2");
    expect(prompt).toContain("USER: I want go Japan.");
  });
});
