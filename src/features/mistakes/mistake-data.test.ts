import { describe, expect, it } from "vitest";

import {
  createMistakeFromEvaluation,
  createSeedMistakes,
  filterMistakes,
} from "./mistake-data";

describe("mistake data", () => {
  const referenceDate = new Date(2026, 6, 30, 12);
  const evaluation = {
    original: "I want go Japan.",
    improved: "I want to go to Japan.",
    reason: {
      "zh-CN": "want 后接 to + 动词原形。",
      en: "Use want to + verb.",
    },
    difficulty: 3,
    newExpressions: 2,
    corrections: 1,
    durationMinutes: 8,
  };

  it("creates stable seed states from review counts", () => {
    const mistakes = createSeedMistakes(referenceDate);
    expect(mistakes).toHaveLength(5);
    expect(mistakes.filter((item) => item.status === "mastered")).toHaveLength(1);
  });

  it("filters by category and expression text", () => {
    const mistakes = createSeedMistakes(referenceDate);
    expect(filterMistakes(mistakes, "grammar", "")).toHaveLength(2);
    expect(filterMistakes(mistakes, "all", "reservation")).toHaveLength(1);
  });

  it("creates a learning item from an evaluation", () => {
    const mistake = createMistakeFromEvaluation(
      "conversation-1",
      "scene-airport",
      evaluation,
      referenceDate,
    );
    expect(mistake.id).toBe("mistake-conversation-1");
    expect(mistake.status).toBe("learning");
    expect(mistake.original).toBe(evaluation.original);
  });
});
