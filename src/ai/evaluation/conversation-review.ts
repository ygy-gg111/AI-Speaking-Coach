import { z } from "zod";

import type {
  ConversationEvaluation,
  ReviewConversationMessage,
} from "../../features/conversation/types";

export const conversationReviewSchema = z.object({
  original: z.string().min(1).max(500),
  improved: z.string().min(1).max(500),
  reason: z.object({
    "zh-CN": z.string().min(1).max(800),
    en: z.string().min(1).max(800),
  }),
  difficulty: z.number().int().min(1).max(5),
  newExpressions: z.number().int().min(0).max(50),
  corrections: z.number().int().min(0).max(20),
});

export type ConversationReviewModelOutput = z.infer<
  typeof conversationReviewSchema
>;

type FallbackReviewInput = {
  messages: ReviewConversationMessage[];
  learnerLevel: string;
  durationSeconds: number;
};

function improveCommonExpression(original: string) {
  return original
    .replace(/\bwant\s+go\b/gi, "want to go")
    .replace(/\bgo\s+(?=[A-Z][a-z])/g, "go to ")
    .replace(/\bi\b/g, "I")
    .replace(/\s+/g, " ")
    .trim();
}

export function createFallbackEvaluation({
  messages,
  learnerLevel,
  durationSeconds,
}: FallbackReviewInput): ConversationEvaluation {
  const userMessages = messages.filter((message) => message.role === "user");
  const original = userMessages.at(-1)?.text.trim() || "Keep speaking.";
  const improved = improveCommonExpression(original);
  const hasCorrection = original !== improved;
  const uniqueAssistantWords = new Set(
    messages
      .filter((message) => message.role === "assistant")
      .flatMap((message) => message.text.toLowerCase().match(/[a-z']+/g) ?? []),
  );

  return {
    original,
    improved,
    reason: hasCorrection
      ? {
          "zh-CN":
            "这是本地降级分析：want 后接动作时通常使用 want to + 动词原形；前往地点时通常使用 go to。",
          en: "This is a local fallback analysis: use want to + verb, and usually use go to before a destination.",
        }
      : {
          "zh-CN":
            "这是本地降级分析：当前表达可以理解。配置文本分析模型后可获得更细致的自然度和语法建议。",
          en: "This is a local fallback analysis: the expression is understandable. Configure the text model for more detailed feedback.",
        },
    difficulty: learnerLevel.startsWith("A") ? 2 : 3,
    newExpressions: Math.min(8, Math.floor(uniqueAssistantWords.size / 4)),
    corrections: hasCorrection ? 1 : 0,
    durationMinutes: Math.max(1, Math.ceil(durationSeconds / 60)),
  };
}

export function buildConversationReviewPrompt(input: {
  sceneName: string;
  learnerLevel: string;
  messages: ReviewConversationMessage[];
}) {
  return [
    "Evaluate this English speaking practice conversation.",
    `Scene: ${input.sceneName}`,
    `Learner CEFR level: ${input.learnerLevel}`,
    "",
    "Return one high-value correction from the learner's most important recent mistake.",
    "Preserve the learner's intended meaning.",
    "Make the improved expression natural for the scene and level.",
    "Explain the reason in both Simplified Chinese and English.",
    "Count only meaningful new expressions and actual learner corrections.",
    "",
    "Conversation:",
    ...input.messages.map(
      (message) => `${message.role.toUpperCase()}: ${message.text}`,
    ),
  ].join("\n");
}
