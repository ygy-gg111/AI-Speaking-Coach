import { toLocalDateKey } from "../learning/learning-data";
import type { PracticeRecord } from "../learning/types";
import type { MistakeRecord } from "../mistakes/types";

import type {
  AbilityMetric,
  LearningReport,
  ReportPeriod,
  ReportTrendDay,
  SceneReportItem,
  WeaknessItem,
} from "./types";

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function getRecordsBetween(
  records: PracticeRecord[],
  startDate: string,
  endDate: string,
) {
  return records.filter((record) => {
    const date = toLocalDateKey(record.completedAt);
    return date >= startDate && date <= endDate;
  });
}

function sum(
  records: PracticeRecord[],
  field: "durationMinutes" | "newExpressions" | "corrections",
) {
  return records.reduce((total, record) => total + record[field], 0);
}

function buildTrend(
  records: PracticeRecord[],
  start: Date,
  period: ReportPeriod,
): ReportTrendDay[] {
  return Array.from({ length: period }, (_, index) => {
    const date = toLocalDateKey(addDays(start, index));
    const dailyRecords = records.filter(
      (record) => toLocalDateKey(record.completedAt) === date,
    );
    return {
      date,
      durationMinutes: sum(dailyRecords, "durationMinutes"),
      practiceCount: dailyRecords.length,
      newExpressions: sum(dailyRecords, "newExpressions"),
    };
  });
}

function buildScenes(records: PracticeRecord[]): SceneReportItem[] {
  const sceneMap = new Map<string, Omit<SceneReportItem, "share">>();
  records.forEach((record) => {
    const current = sceneMap.get(record.sceneId) ?? {
      sceneId: record.sceneId,
      practiceCount: 0,
      durationMinutes: 0,
    };
    sceneMap.set(record.sceneId, {
      ...current,
      practiceCount: current.practiceCount + 1,
      durationMinutes: current.durationMinutes + record.durationMinutes,
    });
  });
  const totalMinutes = sum(records, "durationMinutes");
  return [...sceneMap.values()]
    .map((scene) => ({
      ...scene,
      share: totalMinutes
        ? Math.round((scene.durationMinutes / totalMinutes) * 100)
        : 0,
    }))
    .sort((a, b) => b.durationMinutes - a.durationMinutes);
}

function buildAbilities(records: PracticeRecord[]): AbilityMetric[] {
  const practiceCount = records.length;
  const averageMastery = practiceCount
    ? records.reduce((total, record) => total + record.mastery, 0) /
      practiceCount
    : 0;
  const corrections = sum(records, "corrections");
  const expressions = sum(records, "newExpressions");
  const sceneCount = new Set(records.map((record) => record.sceneId)).size;

  return [
    {
      key: "expressionCompleteness",
      value: clamp(averageMastery),
    },
    {
      key: "grammarAccuracy",
      value: practiceCount
        ? clamp(92 - (corrections / practiceCount) * 7, 30)
        : 0,
    },
    {
      key: "vocabularyRichness",
      value: practiceCount
        ? clamp(35 + (expressions / practiceCount) * 7, 30)
        : 0,
    },
    {
      key: "sceneCompletion",
      value: practiceCount
        ? clamp(averageMastery * 0.7 + Math.min(sceneCount, 5) * 6)
        : 0,
    },
  ];
}

function buildWeaknesses(mistakes: MistakeRecord[]): WeaknessItem[] {
  const learningMistakes = mistakes.filter(
    (mistake) => mistake.status === "learning",
  );
  const categories = ["grammar", "vocabulary", "expression"] as const;
  return categories
    .map((category) => {
      const count = learningMistakes.filter(
        (mistake) => mistake.category === category,
      ).length;
      return {
        category,
        count,
        share: learningMistakes.length
          ? Math.round((count / learningMistakes.length) * 100)
          : 0,
      };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function buildLearningReport(
  records: PracticeRecord[],
  mistakes: MistakeRecord[],
  period: ReportPeriod,
  today = new Date(),
): LearningReport {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = addDays(end, -(period - 1));
  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(period - 1));
  const startDate = toLocalDateKey(start);
  const endDate = toLocalDateKey(end);
  const currentRecords = getRecordsBetween(records, startDate, endDate);
  const previousRecords = getRecordsBetween(
    records,
    toLocalDateKey(previousStart),
    toLocalDateKey(previousEnd),
  );
  const durationMinutes = sum(currentRecords, "durationMinutes");
  const previousDuration = sum(previousRecords, "durationMinutes");
  const averageMastery = currentRecords.length
    ? Math.round(
        currentRecords.reduce((total, record) => total + record.mastery, 0) /
          currentRecords.length,
      )
    : 0;

  return {
    period,
    startDate,
    endDate,
    activeDays: new Set(
      currentRecords.map((record) => toLocalDateKey(record.completedAt)),
    ).size,
    practiceCount: currentRecords.length,
    durationMinutes,
    newExpressions: sum(currentRecords, "newExpressions"),
    corrections: sum(currentRecords, "corrections"),
    averageMastery,
    durationChange:
      previousDuration > 0
        ? Math.round(
            ((durationMinutes - previousDuration) / previousDuration) * 100,
          )
        : null,
    trend: buildTrend(currentRecords, start, period),
    scenes: buildScenes(currentRecords),
    abilities: buildAbilities(currentRecords),
    weaknesses: buildWeaknesses(mistakes),
  };
}
