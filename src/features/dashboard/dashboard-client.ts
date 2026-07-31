import { requestApi } from "@/lib/api-client";

import type { DashboardSummary } from "./dashboard-data";

export function getDashboard(timezoneOffset: number) {
  return requestApi<DashboardSummary>(
    `/api/v1/dashboard?timezoneOffset=${timezoneOffset}`,
  );
}
