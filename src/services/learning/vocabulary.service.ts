import { DomainError } from "@/lib/domain-error";
import type {
  VocabularyRecordData,
  VocabularyRepository,
} from "@/repositories/vocabulary.repository";

export class VocabularyService {
  constructor(private readonly vocabulary: VocabularyRepository) {}

  async list(userId: string, limit = 200) {
    return (await this.vocabulary.list(userId, limit)).map(toPublicEntry);
  }

  async create(
    userId: string,
    input: {
      conversationId: string;
      phrase: string;
      meaning: { "zh-CN": string; en: string };
      example: string;
    },
  ) {
    const entry = await this.vocabulary.createForConversation(userId, {
      conversationId: input.conversationId,
      phrase: input.phrase,
      meaningZh: input.meaning["zh-CN"],
      meaningEn: input.meaning.en,
      example: input.example,
    });
    if (!entry) {
      throw new DomainError(
        "VOCABULARY_CONVERSATION_NOT_FOUND",
        "A completed conversation is required before saving vocabulary.",
        404,
      );
    }
    return toPublicEntry(entry);
  }

  async update(
    userId: string,
    entryId: string,
    input: { action: "favorite"; favorite: boolean } | { action: "review" },
  ) {
    const entry =
      input.action === "favorite"
        ? await this.vocabulary.setFavorite(userId, entryId, input.favorite)
        : await this.vocabulary.review(userId, entryId);
    if (!entry) {
      throw new DomainError(
        "VOCABULARY_NOT_FOUND",
        "Vocabulary entry not found.",
        404,
      );
    }
    return toPublicEntry(entry);
  }
}

function toPublicEntry(entry: VocabularyRecordData) {
  return {
    id: entry.id,
    conversationId: entry.conversationId,
    sceneId: entry.sceneId,
    phrase: entry.phrase,
    meaning: { "zh-CN": entry.meaningZh, en: entry.meaningEn },
    example: entry.example,
    favorite: entry.favorite,
    reviewCount: entry.reviewCount,
    createdAt: entry.createdAt.toISOString(),
  };
}
