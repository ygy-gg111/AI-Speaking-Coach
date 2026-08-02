import { requestApi } from "@/lib/api-client";

import type { MistakeCategory, MistakeRecord } from "./types";

export function getMistakes(limit = 200) {
  return requestApi<MistakeRecord[]>(`/api/v1/mistakes?limit=${limit}`);
}

export function saveMistake(input: {
  conversationId: string;
  original: string;
  improved: string;
  reason: { "zh-CN": string; en: string };
  category?: MistakeCategory;
}) {
  return requestApi<MistakeRecord>("/api/v1/mistakes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function markMistakeReviewed(mistakeId: string) {
  return requestApi<MistakeRecord>(
    `/api/v1/mistakes/${encodeURIComponent(mistakeId)}/review`,
    { method: "POST" },
  );
}
