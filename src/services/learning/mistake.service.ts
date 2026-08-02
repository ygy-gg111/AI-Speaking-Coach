import { MistakeCategory } from "@prisma/client";

import { DomainError } from "@/lib/domain-error";
import type {
  CreateMistakeData,
  MistakeRecordData,
  MistakeRepository,
} from "@/repositories/mistake.repository";

export class MistakeService {
  constructor(private readonly mistakes: MistakeRepository) {}

  async list(userId: string, limit = 200) {
    return (await this.mistakes.list(userId, limit)).map(toPublicMistake);
  }

  async create(
    userId: string,
    input: Omit<CreateMistakeData, "reasonZh" | "reasonEn" | "category"> & {
      reason: { "zh-CN": string; en: string };
      category: "grammar" | "vocabulary" | "expression";
    },
  ) {
    const mistake = await this.mistakes.createForConversation(userId, {
      conversationId: input.conversationId,
      original: input.original,
      improved: input.improved,
      reasonZh: input.reason["zh-CN"],
      reasonEn: input.reason.en,
      category: toDatabaseCategory(input.category),
    });
    if (!mistake) {
      throw new DomainError(
        "MISTAKE_CONVERSATION_NOT_FOUND",
        "A completed conversation is required before saving a mistake.",
        404,
      );
    }
    return toPublicMistake(mistake);
  }

  async review(userId: string, mistakeId: string) {
    const mistake = await this.mistakes.review(userId, mistakeId);
    if (!mistake) {
      throw new DomainError("MISTAKE_NOT_FOUND", "Mistake not found.", 404);
    }
    return toPublicMistake(mistake);
  }
}

function toPublicMistake(mistake: MistakeRecordData) {
  return {
    id: mistake.id,
    conversationId: mistake.conversationId,
    sceneId: mistake.sceneId,
    original: mistake.original,
    improved: mistake.improved,
    reason: { "zh-CN": mistake.reasonZh, en: mistake.reasonEn },
    category: mistake.category.toLowerCase() as
      | "grammar"
      | "vocabulary"
      | "expression",
    createdAt: mistake.createdAt.toISOString(),
    reviewCount: mistake.reviewCount,
    status: mistake.status.toLowerCase() as "learning" | "mastered",
  };
}

function toDatabaseCategory(category: string) {
  return {
    grammar: MistakeCategory.GRAMMAR,
    vocabulary: MistakeCategory.VOCABULARY,
    expression: MistakeCategory.EXPRESSION,
  }[category] ?? MistakeCategory.EXPRESSION;
}
