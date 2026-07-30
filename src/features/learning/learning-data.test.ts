import { describe, expect, it } from "vitest";

import {
  buildCalendarMonth,
  createSeedLearningRecords,
  getLearningStreak,
  getLearningRecordsForDate,
  getSceneMastery,
  isValidLocalDateKey,
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

  it("validates calendar route dates", () => {
    expect(isValidLocalDateKey("2026-07-30")).toBe(true);
    expect(isValidLocalDateKey("2024-02-29")).toBe(true);
    expect(isValidLocalDateKey("2026-02-29")).toBe(false);
    expect(isValidLocalDateKey("2026-13-01")).toBe(false);
    expect(isValidLocalDateKey("07-30-2026")).toBe(false);
  });

  it("returns records for a day in latest-first order", () => {
    const sameDayRecords = [
      ...records,
      {
        ...records[0],
        id: "practice-airport-later",
        conversationId: "practice-airport-later",
        completedAt: new Date(2026, 6, 30, 18, 30).toISOString(),
      },
    ];

    expect(
      getLearningRecordsForDate(sameDayRecords, "2026-07-30").map(
        (record) => record.id,
      ),
    ).toEqual(["practice-airport-later", "practice-airport-1"]);
  });
});
