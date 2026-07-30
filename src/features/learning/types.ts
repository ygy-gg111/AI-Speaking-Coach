export type PracticeRecord = {
  id: string;
  conversationId: string;
  sceneId: string;
  completedAt: string;
  durationMinutes: number;
  newExpressions: number;
  corrections: number;
  mastery: number;
};

export type DailyLearningSummary = {
  date: string;
  practiceCount: number;
  durationMinutes: number;
  newExpressions: number;
  corrections: number;
};

export type CalendarDay = {
  date: string;
  day: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  summary: DailyLearningSummary | null;
};
