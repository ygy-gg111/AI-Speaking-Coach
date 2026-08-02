import type { PracticeRecord } from "@/features/learning/types";

export type DashboardSummary = {
  dailyGoalMinutes: number;
  todayMinutes: number;
  learnedScenes: number;
  masteredExpressions: number;
  yesterdayScenes: number;
  yesterdayExpressions: number;
  streak: number;
  recentRecord: PracticeRecord | null;
};

export function buildDashboardSummary(
  records: PracticeRecord[],
  now = new Date(),
  timezoneOffset = now.getTimezoneOffset(),
  dailyGoalMinutes = 10,
): DashboardSummary {
  const sorted = [...records].sort(
    (left, right) =>
      new Date(right.completedAt).getTime() -
      new Date(left.completedAt).getTime(),
  );
  const today = toOffsetDateKey(now, timezoneOffset);
  const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1_000);
  const yesterday = toOffsetDateKey(yesterdayDate, timezoneOffset);
  const todayRecords = sorted.filter(
    (record) =>
      toOffsetDateKey(new Date(record.completedAt), timezoneOffset) === today,
  );
  const yesterdayRecords = sorted.filter(
    (record) =>
      toOffsetDateKey(new Date(record.completedAt), timezoneOffset) ===
      yesterday,
  );

  return {
    dailyGoalMinutes,
    todayMinutes: todayRecords.reduce(
      (sum, record) => sum + record.durationMinutes,
      0,
    ),
    learnedScenes: new Set(records.map((record) => record.sceneId)).size,
    masteredExpressions: records.reduce(
      (sum, record) => sum + record.newExpressions,
      0,
    ),
    yesterdayScenes: new Set(
      yesterdayRecords.map((record) => record.sceneId),
    ).size,
    yesterdayExpressions: yesterdayRecords.reduce(
      (sum, record) => sum + record.newExpressions,
      0,
    ),
    streak: getOffsetLearningStreak(sorted, now, timezoneOffset),
    recentRecord: sorted[0] ?? null,
  };
}

function getOffsetLearningStreak(
  records: PracticeRecord[],
  now: Date,
  timezoneOffset: number,
) {
  const activeDates = new Set(
    records.map((record) =>
      toOffsetDateKey(new Date(record.completedAt), timezoneOffset),
    ),
  );
  let streak = 0;
  let cursor = new Date(now);
  while (activeDates.has(toOffsetDateKey(cursor, timezoneOffset))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1_000);
  }
  return streak;
}

function toOffsetDateKey(value: Date, timezoneOffset: number) {
  return new Date(value.getTime() - timezoneOffset * 60_000)
    .toISOString()
    .slice(0, 10);
}
