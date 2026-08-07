import type { MistakeCategory } from "../mistakes/types";

export type ReportPeriod = 7 | 30;

export type ReportTrendDay = {
  date: string;
  durationMinutes: number;
  practiceCount: number;
  newExpressions: number;
};

export type SceneReportItem = {
  sceneId: string;
  practiceCount: number;
  durationMinutes: number;
  share: number;
};

export type AbilityMetricKey =
  | "expressionCompleteness"
  | "grammarAccuracy"
  | "vocabularyRichness"
  | "sceneCompletion"
  | "pronunciationAccuracy"
  | "pronunciationFluency"
  | "pronunciationProsody";

export type AbilityMetric = {
  key: AbilityMetricKey;
  value: number;
};

export type WeaknessItem = {
  category: MistakeCategory;
  count: number;
  share: number;
};

export type PronunciationReportAttempt = {
  createdAt: Date | string;
  score: number;
  accuracy: number;
  fluency: number;
  prosody: number;
};

export type PronunciationReportSummary = {
  attemptCount: number;
  averageScore: number;
  bestScore: number;
};

export type LearningReport = {
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  activeDays: number;
  practiceCount: number;
  durationMinutes: number;
  newExpressions: number;
  corrections: number;
  averageMastery: number;
  durationChange: number | null;
  trend: ReportTrendDay[];
  scenes: SceneReportItem[];
  abilities: AbilityMetric[];
  weaknesses: WeaknessItem[];
  pronunciation: PronunciationReportSummary;
};
