import type {
  CalendarDay,
  DailyLearningSummary,
  PracticeRecord,
} from "./types";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function toLocalDateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
}

export function createSeedLearningRecords(
  referenceDate = new Date(),
): PracticeRecord[] {
  const create = (
    id: string,
    daysAgo: number,
    sceneId: string,
    durationMinutes: number,
    newExpressions: number,
    corrections: number,
    mastery: number,
  ): PracticeRecord => {
    const completedAt = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate() - daysAgo,
      9 + (daysAgo % 5),
      20,
    );
    return {
      id,
      conversationId: id,
      sceneId,
      completedAt: completedAt.toISOString(),
      durationMinutes,
      newExpressions,
      corrections,
      mastery,
    };
  };

  return [
    create("practice-airport-1", 0, "scene-airport", 12, 8, 5, 72),
    create("practice-coffee-1", 1, "scene-coffee", 8, 5, 2, 84),
    create("practice-hotel-1", 3, "scene-hotel", 10, 6, 3, 66),
    create("practice-meeting-1", 6, "scene-meeting", 14, 7, 4, 48),
    create("practice-airport-2", 9, "scene-airport", 11, 4, 2, 68),
    create("practice-restaurant-1", 15, "scene-restaurant", 9, 5, 2, 55),
  ];
}

export function summarizeLearningByDate(records: PracticeRecord[]) {
  const summaries = new Map<string, DailyLearningSummary>();
  records.forEach((record) => {
    const date = toLocalDateKey(record.completedAt);
    const current = summaries.get(date) ?? {
      date,
      practiceCount: 0,
      durationMinutes: 0,
      newExpressions: 0,
      corrections: 0,
    };
    summaries.set(date, {
      date,
      practiceCount: current.practiceCount + 1,
      durationMinutes: current.durationMinutes + record.durationMinutes,
      newExpressions: current.newExpressions + record.newExpressions,
      corrections: current.corrections + record.corrections,
    });
  });
  return summaries;
}

export function buildCalendarMonth(
  year: number,
  month: number,
  records: PracticeRecord[],
  today = new Date(),
): CalendarDay[] {
  const summaries = summarizeLearningByDate(records);
  const first = new Date(year, month, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - mondayOffset);
  const todayKey = toLocalDateKey(today);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + index,
    );
    const key = toLocalDateKey(date);
    return {
      date: key,
      day: date.getDate(),
      inCurrentMonth: date.getMonth() === month,
      isToday: key === todayKey,
      summary: summaries.get(key) ?? null,
    };
  });
}

export function getSceneMastery(records: PracticeRecord[], sceneId: string) {
  const sceneRecords = records.filter((record) => record.sceneId === sceneId);
  if (!sceneRecords.length) {
    return 0;
  }
  return Math.round(
    sceneRecords.reduce((sum, record) => sum + record.mastery, 0) /
      sceneRecords.length,
  );
}

export function getLearningStreak(records: PracticeRecord[], today = new Date()) {
  const activeDates = new Set(records.map((record) => toLocalDateKey(record.completedAt)));
  let streak = 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  while (activeDates.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
