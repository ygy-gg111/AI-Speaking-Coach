import { describe, expect, it } from "vitest";

import type { PracticeRecord } from "@/features/learning/types";

import { buildDashboardSummary } from "./dashboard-data";

const records: PracticeRecord[] = [
  {
    id: "practice-1",
    conversationId: "conversation-1",
    sceneId: "scene-airport",
    completedAt: "2026-07-30T16:30:00.000Z",
    durationMinutes: 12,
    newExpressions: 5,
    corrections: 2,
    mastery: 72,
  },
  {
    id: "practice-2",
    conversationId: "conversation-2",
    sceneId: "scene-coffee",
    completedAt: "2026-07-29T16:30:00.000Z",
    durationMinutes: 8,
    newExpressions: 3,
    corrections: 1,
    mastery: 80,
  },
];

describe("dashboard data", () => {
  it("aggregates metrics using the learner timezone", () => {
    const summary = buildDashboardSummary(
      records,
      new Date("2026-07-31T04:00:00.000Z"),
      -480,
    );

    expect(summary).toMatchObject({
      dailyGoalMinutes: 10,
      todayMinutes: 12,
      learnedScenes: 2,
      masteredExpressions: 8,
      yesterdayScenes: 1,
      yesterdayExpressions: 3,
      streak: 2,
    });
    expect(summary.recentRecord?.id).toBe("practice-1");
  });

  it("uses the learner's configured daily goal", () => {
    const summary = buildDashboardSummary(
      records,
      new Date("2026-07-31T04:00:00.000Z"),
      -480,
      25,
    );

    expect(summary.dailyGoalMinutes).toBe(25);
  });

  it("returns an empty dashboard for a new learner", () => {
    expect(
      buildDashboardSummary([], new Date("2026-07-31T04:00:00.000Z"), -480),
    ).toMatchObject({
      todayMinutes: 0,
      learnedScenes: 0,
      masteredExpressions: 0,
      streak: 0,
      recentRecord: null,
    });
  });
});
