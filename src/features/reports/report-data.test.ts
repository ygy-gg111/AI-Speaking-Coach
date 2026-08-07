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
    expect(report.abilities).toHaveLength(7);
    expect(report.weaknesses[0]).toMatchObject({
      category: "grammar",
      count: 2,
    });
  });

  it("adds persisted pronunciation attempts to the report", () => {
    const report = buildLearningReport(
      records,
      mistakes,
      7,
      today,
      today.getTimezoneOffset(),
      [
        {
          createdAt: new Date(2026, 6, 30, 10),
          score: 86,
          accuracy: 90,
          fluency: 82,
          prosody: 78,
        },
        {
          createdAt: new Date(2026, 6, 29, 10),
          score: 92,
          accuracy: 94,
          fluency: 88,
          prosody: 84,
        },
      ],
    );

    expect(report.pronunciation).toEqual({
      attemptCount: 2,
      averageScore: 89,
      bestScore: 92,
    });
    expect(report.abilities).toEqual(
      expect.arrayContaining([
        { key: "pronunciationAccuracy", value: 92 },
        { key: "pronunciationFluency", value: 85 },
        { key: "pronunciationProsody", value: 81 },
      ]),
    );
  });

  it("groups records using the learner timezone", () => {
    const report = buildLearningReport(
      [
        {
          id: "practice-timezone",
          conversationId: "conversation-timezone",
          sceneId: "scene-airport",
          completedAt: "2026-07-30T16:30:00.000Z",
          durationMinutes: 9,
          newExpressions: 3,
          corrections: 1,
          mastery: 75,
        },
      ],
      [],
      7,
      new Date("2026-07-31T04:00:00.000Z"),
      -480,
    );

    expect(report.endDate).toBe("2026-07-31");
    expect(report.trend.at(-1)).toMatchObject({
      date: "2026-07-31",
      durationMinutes: 9,
    });
  });
});
