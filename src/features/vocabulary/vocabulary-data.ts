import { toLocalDateKey } from "@/features/learning/learning-data";
import type { ConversationEvaluation } from "@/features/conversation/types";

import type {
  VocabularyEntry,
  VocabularyFilter,
  VocabularyStatus,
} from "./types";

export function createSeedVocabulary(referenceDate = new Date()): VocabularyEntry[] {
  const create = (
    id: string,
    daysAgo: number,
    sceneId: string,
    phrase: string,
    phonetic: string,
    meaningZh: string,
    meaningEn: string,
    example: string,
    reviewCount: number,
    favorite = false,
  ): VocabularyEntry => ({
    id,
    conversationId: id.replace("vocabulary", "practice"),
    sceneId,
    phrase,
    phonetic,
    meaning: { "zh-CN": meaningZh, en: meaningEn },
    example,
    favorite,
    reviewCount,
    createdAt: new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate() - daysAgo,
      10,
    ).toISOString(),
  });
  return [
    create("vocabulary-check-in", 0, "scene-airport", "check in", "/tʃek ɪn/", "办理入住或值机", "register at a hotel or airport", "I'd like to check in for my flight.", 0, true),
    create("vocabulary-carry-on", 2, "scene-airport", "carry-on bag", "/ˈkæri ɒn bæɡ/", "随身行李", "a bag taken into the cabin", "Is this carry-on bag within the size limit?", 1),
    create("vocabulary-reservation", 5, "scene-hotel", "make a reservation", "/meɪk ə ˌrezəˈveɪʃn/", "进行预订", "book a table, room, or service", "I'd like to make a reservation for two.", 3),
  ];
}

export function getVocabularyStatus(
  entry: VocabularyEntry,
  today = new Date(),
): VocabularyStatus {
  if (entry.reviewCount >= 3) return "mastered";
  if (toLocalDateKey(entry.createdAt) === toLocalDateKey(today)) return "today";
  return "review";
}

export function filterVocabulary(
  entries: VocabularyEntry[],
  filter: VocabularyFilter,
  query: string,
  locale: "zh-CN" | "en",
) {
  const normalized = query.trim().toLocaleLowerCase();
  return entries.filter((entry) => {
    const status = getVocabularyStatus(entry);
    const matchesFilter =
      filter === "all" ||
      (filter === "favorite" ? entry.favorite : filter === status);
    const matchesQuery =
      !normalized ||
      `${entry.phrase} ${entry.meaning[locale]}`
        .toLocaleLowerCase()
        .includes(normalized);
    return matchesFilter && matchesQuery;
  });
}

export function createVocabularyFromEvaluation(
  conversationId: string,
  sceneId: string,
  evaluation: ConversationEvaluation,
  createdAt = new Date(),
): VocabularyEntry {
  return {
    id: `vocabulary-${conversationId}`,
    conversationId,
    sceneId,
    phrase: evaluation.improved,
    meaning: evaluation.reason,
    example: evaluation.improved,
    favorite: false,
    reviewCount: 0,
    createdAt: createdAt.toISOString(),
  };
}
