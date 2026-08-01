import { requestApi } from "@/lib/api-client";

import type { LearningReport, ReportPeriod } from "./types";

export function getLearningReport(
  period: ReportPeriod,
  timezoneOffset: number,
) {
  const search = new URLSearchParams({
    period: String(period),
    timezoneOffset: String(timezoneOffset),
  });
  return requestApi<LearningReport>(`/api/v1/reports?${search.toString()}`);
}
