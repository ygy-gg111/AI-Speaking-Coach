import { requestApi } from "@/lib/api-client";

import type { VocabularyEntry } from "./types";

export function getVocabulary(limit = 200) {
  return requestApi<VocabularyEntry[]>(`/api/v1/vocabulary?limit=${limit}`);
}

export function saveVocabulary(input: {
  conversationId: string;
  phrase: string;
  meaning: { "zh-CN": string; en: string };
  example: string;
}) {
  return requestApi<VocabularyEntry>("/api/v1/vocabulary", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateVocabulary(
  entryId: string,
  input: { action: "favorite"; favorite: boolean } | { action: "review" },
) {
  return requestApi<VocabularyEntry>(
    `/api/v1/vocabulary/${encodeURIComponent(entryId)}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}
