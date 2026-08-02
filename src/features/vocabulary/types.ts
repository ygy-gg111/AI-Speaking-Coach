export type VocabularyStatus = "today" | "review" | "mastered";

export type VocabularyEntry = {
  id: string;
  conversationId: string;
  sceneId: string;
  phrase: string;
  phonetic?: string;
  meaning: { "zh-CN": string; en: string };
  example: string;
  favorite: boolean;
  reviewCount: number;
  createdAt: string;
};

export type VocabularyFilter = "all" | VocabularyStatus | "favorite";
