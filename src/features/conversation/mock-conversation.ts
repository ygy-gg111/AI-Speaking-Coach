import type {
  ConversationEvaluation,
  ConversationMessage,
} from "./types";

type MockConversationInput = {
  partnerName: { "zh-CN": string; en: string };
  openingExpression: string;
};

export function createMockConversationMessages({
  partnerName,
  openingExpression,
}: MockConversationInput): ConversationMessage[] {
  const greeting = `Hello! I'm your ${partnerName.en.toLowerCase()} today. How can I help?`;

  return [
    {
      id: "message-1",
      role: "assistant",
      text: { "zh-CN": greeting, en: greeting },
      translation: {
        "zh-CN": `你好！今天我会扮演${partnerName["zh-CN"]}。需要我怎么帮助你？`,
        en: `你好！今天我会扮演${partnerName["zh-CN"]}。需要我怎么帮助你？`,
      },
      audioAvailable: true,
    },
    {
      id: "message-2",
      role: "user",
      text: { "zh-CN": openingExpression, en: openingExpression },
      audioAvailable: true,
    },
    {
      id: "message-3",
      role: "assistant",
      text: {
        "zh-CN": "Of course. Let me confirm a few details with you.",
        en: "Of course. Let me confirm a few details with you.",
      },
      translation: {
        "zh-CN": "当然可以。我再和你确认几个细节。",
        en: "当然可以。我再和你确认几个细节。",
      },
      audioAvailable: true,
    },
  ];
}

export const mockEvaluation: ConversationEvaluation = {
  original: "I want go Japan.",
  improved: "I want to go to Japan.",
  reason: {
    "zh-CN": "want 后面需要接 to + 动词原形；表示前往某地时，go 后面通常也需要 to。",
    en: "Use want to + verb. When you describe traveling to a place, go is usually followed by to.",
  },
  difficulty: 3,
  newExpressions: 8,
  corrections: 5,
  durationMinutes: 12,
};
