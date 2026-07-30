export type ConversationRole = "assistant" | "user";

export type ConversationMessage = {
  id: string;
  role: ConversationRole;
  text: {
    "zh-CN": string;
    en: string;
  };
  translation?: {
    "zh-CN": string;
    en: string;
  };
  audioAvailable: boolean;
  correction?: {
    original: string;
    improved: string;
  };
};

export type ConversationEvaluation = {
  original: string;
  improved: string;
  reason: {
    "zh-CN": string;
    en: string;
  };
  difficulty: number;
  newExpressions: number;
  corrections: number;
  durationMinutes: number;
};
