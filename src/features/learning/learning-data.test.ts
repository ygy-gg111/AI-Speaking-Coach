import { describe, expect, it } from "vitest";

import {
  buildCalendarMonth,
  createSeedLearningRecords,
  getLearningStreak,
  getSceneMastery,
  summarizeLearningByDate,
} from "./learning-data";

const reference = new Date(2026, 6, 30, 12);

describe("learning data", () => {
  const records = createSeedLearningRecords(reference);

  it("summarizes records by local date", () => {
    const summary = summarizeLearningByDate(records).get("2026-07-30");
    expect(summary).toMatchObject({
      practiceCount: 1,
      durationMinutes: 12,
      newExpressions: 8,
    });
  });

  it("builds a six-week Monday-first calendar", () => {
    const days = buildCalendarMonth(2026, 6, records, reference);
    expect(days).toHaveLength(42);
    expect(days[0].date).toBe("2026-06-29");
    expect(days.some((day) => day.isToday && day.summary)).toBe(true);
  });

  it("calculates scene mastery and current streak", () => {
    expect(getSceneMastery(records, "scene-airport")).toBe(70);
    expect(getLearningStreak(records, reference)).toBe(2);
  });
});
