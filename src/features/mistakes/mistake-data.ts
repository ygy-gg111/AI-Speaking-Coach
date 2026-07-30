import type { ConversationEvaluation } from "@/features/conversation/types";

import type { MistakeCategory, MistakeRecord } from "./types";

export type MistakeFilter = "all" | MistakeCategory;

export function createSeedMistakes(referenceDate = new Date()): MistakeRecord[] {
  const create = (
    id: string,
    daysAgo: number,
    sceneId: string,
    original: string,
    improved: string,
    reasonZh: string,
    reasonEn: string,
    category: MistakeCategory,
    reviewCount: number,
  ): MistakeRecord => {
    const createdAt = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate() - daysAgo,
      10,
      20,
    );
    return {
      id,
      conversationId: id.replace("mistake", "practice"),
      sceneId,
      original,
      improved,
      reason: { "zh-CN": reasonZh, en: reasonEn },
      category,
      createdAt: createdAt.toISOString(),
      reviewCount,
      status: reviewCount >= 3 ? "mastered" : "learning",
    };
  };

  return [
    create(
      "mistake-airport-1",
      0,
      "scene-airport",
      "I want go Japan.",
      "I want to go to Japan.",
      "want 后面需要接 to + 动词原形；表示前往某地时，go 后通常也需要 to。",
      "Use want to + verb. When describing travel to a place, go is usually followed by to.",
      "grammar",
      1,
    ),
    create(
      "mistake-coffee-1",
      1,
      "scene-coffee",
      "Give me a big coffee.",
      "Could I have a large coffee, please?",
      "点餐时使用 Could I have... 会更自然礼貌，杯型通常使用 large。",
      "Could I have... sounds more natural and polite when ordering, and large is the usual size word.",
      "expression",
      2,
    ),
    create(
      "mistake-hotel-1",
      3,
      "scene-hotel",
      "I have ordered a room.",
      "I have a reservation.",
      "酒店预订通常使用 reservation，而不是 order。",
      "Use reservation for a hotel booking rather than order.",
      "vocabulary",
      3,
    ),
    create(
      "mistake-meeting-1",
      6,
      "scene-meeting",
      "We need discuss about the timeline.",
      "We need to discuss the timeline.",
      "need 后接 to do；discuss 是及物动词，后面不需要 about。",
      "Use need to + verb. Discuss takes a direct object, so about is unnecessary.",
      "grammar",
      0,
    ),
    create(
      "mistake-restaurant-1",
      15,
      "scene-restaurant",
      "I am allergic with peanuts.",
      "I am allergic to peanuts.",
      "allergic 的固定搭配是 be allergic to。",
      "The fixed expression is be allergic to.",
      "vocabulary",
      1,
    ),
  ];
}

export function filterMistakes(
  mistakes: MistakeRecord[],
  filter: MistakeFilter,
  query: string,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return mistakes.filter((mistake) => {
    const matchesFilter =
      filter === "all" || mistake.category === filter;
    const matchesQuery =
      !normalizedQuery ||
      mistake.original.toLocaleLowerCase().includes(normalizedQuery) ||
      mistake.improved.toLocaleLowerCase().includes(normalizedQuery);
    return matchesFilter && matchesQuery;
  });
}

export function createMistakeFromEvaluation(
  conversationId: string,
  sceneId: string,
  evaluation: ConversationEvaluation,
  createdAt = new Date(),
): MistakeRecord {
  return {
    id: `mistake-${conversationId}`,
    conversationId,
    sceneId,
    original: evaluation.original,
    improved: evaluation.improved,
    reason: evaluation.reason,
    category: "expression",
    createdAt: createdAt.toISOString(),
    reviewCount: 0,
    status: "learning",
  };
}
