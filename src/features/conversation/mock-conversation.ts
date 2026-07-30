import type {
  ConversationEvaluation,
  ConversationMessage,
} from "./types";

export const mockConversationMessages: ConversationMessage[] = [
  {
    id: "message-1",
    role: "assistant",
    text: {
      "zh-CN": "Hello! Welcome. May I see your passport?",
      en: "Hello! Welcome. May I see your passport?",
    },
    translation: {
      "zh-CN": "你好，欢迎。可以看一下你的护照吗？",
      en: "你好，欢迎。可以看一下你的护照吗？",
    },
    audioAvailable: true,
  },
  {
    id: "message-2",
    role: "user",
    text: {
      "zh-CN": "I want go Japan.",
      en: "I want go Japan.",
    },
    audioAvailable: true,
    correction: {
      original: "I want go Japan.",
      improved: "I want to go to Japan.",
    },
  },
  {
    id: "message-3",
    role: "assistant",
    text: {
      "zh-CN": "Great! Are you traveling for business or vacation?",
      en: "Great! Are you traveling for business or vacation?",
    },
    translation: {
      "zh-CN": "很好！你是商务出行还是度假？",
      en: "很好！你是商务出行还是度假？",
    },
    audioAvailable: true,
  },
];

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
