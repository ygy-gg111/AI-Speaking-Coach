export type MistakeCategory = "grammar" | "vocabulary" | "expression";

export type MistakeStatus = "learning" | "mastered";

export type MistakeRecord = {
  id: string;
  conversationId: string;
  sceneId: string;
  original: string;
  improved: string;
  reason: {
    "zh-CN": string;
    en: string;
  };
  category: MistakeCategory;
  createdAt: string;
  reviewCount: number;
  status: MistakeStatus;
};
