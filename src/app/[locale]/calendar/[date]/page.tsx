import { notFound } from "next/navigation";

import { DailyLearningDetail } from "@/features/learning/components/daily-learning-detail";
import { isValidLocalDateKey } from "@/features/learning/learning-data";

type CalendarDatePageProps = {
  params: Promise<{ date: string }>;
};

export default async function CalendarDatePage({
  params,
}: CalendarDatePageProps) {
  const { date } = await params;

  if (!isValidLocalDateKey(date)) {
    notFound();
  }

  return <DailyLearningDetail date={date} />;
}
