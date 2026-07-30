import { describe, expect, it } from "vitest";

import { createSeedLearningRecords } from "../learning/learning-data";
import { createSeedMistakes } from "../mistakes/mistake-data";

import { buildLearningReport } from "./report-data";

describe("learning report", () => {
  const today = new Date(2026, 6, 30, 12);
  const records = createSeedLearningRecords(today);
  const mistakes = createSeedMistakes(today);

  it("summarizes the latest seven days", () => {
    const report = buildLearningReport(records, mistakes, 7, today);
    expect(report.practiceCount).toBe(4);
    expect(report.activeDays).toBe(4);
    expect(report.durationMinutes).toBe(44);
    expect(report.newExpressions).toBe(26);
    expect(report.trend).toHaveLength(7);
  });

  it("compares duration with the previous period", () => {
    const report = buildLearningReport(records, mistakes, 7, today);
    expect(report.durationChange).toBe(300);
  });

  it("builds scene, ability, and weakness signals", () => {
    const report = buildLearningReport(records, mistakes, 30, today);
    expect(report.scenes[0].sceneId).toBe("scene-airport");
    expect(report.abilities).toHaveLength(4);
    expect(report.weaknesses[0]).toMatchObject({
      category: "grammar",
      count: 2,
    });
  });
});
