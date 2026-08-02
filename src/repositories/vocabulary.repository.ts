import { ConversationStatus, type PrismaClient } from "@prisma/client";

export type VocabularyRecordData = {
  id: string;
  conversationId: string;
  sceneId: string;
  phrase: string;
  meaningZh: string;
  meaningEn: string;
  example: string;
  favorite: boolean;
  reviewCount: number;
  createdAt: Date;
};

export interface VocabularyRepository {
  list(userId: string, limit: number): Promise<VocabularyRecordData[]>;
  createForConversation(
    userId: string,
    input: {
      conversationId: string;
      phrase: string;
      meaningZh: string;
      meaningEn: string;
      example: string;
    },
  ): Promise<VocabularyRecordData | null>;
  setFavorite(
    userId: string,
    entryId: string,
    favorite: boolean,
  ): Promise<VocabularyRecordData | null>;
  review(userId: string, entryId: string): Promise<VocabularyRecordData | null>;
}

export class PrismaVocabularyRepository implements VocabularyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list(userId: string, limit: number) {
    return this.prisma.vocabularyEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: vocabularySelect,
    });
  }

  async createForConversation(
    userId: string,
    input: {
      conversationId: string;
      phrase: string;
      meaningZh: string;
      meaningEn: string;
      example: string;
    },
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: input.conversationId,
        userId,
        status: ConversationStatus.COMPLETED,
        sceneId: { not: null },
      },
      select: { id: true, sceneId: true },
    });
    if (!conversation?.sceneId) return null;
    return this.prisma.vocabularyEntry.upsert({
      where: { userId_phrase: { userId, phrase: input.phrase } },
      update: {
        conversationId: conversation.id,
        sceneId: conversation.sceneId,
        meaningZh: input.meaningZh,
        meaningEn: input.meaningEn,
        example: input.example,
      },
      create: {
        userId,
        conversationId: conversation.id,
        sceneId: conversation.sceneId,
        phrase: input.phrase,
        meaningZh: input.meaningZh,
        meaningEn: input.meaningEn,
        example: input.example,
      },
      select: vocabularySelect,
    });
  }

  async setFavorite(userId: string, entryId: string, favorite: boolean) {
    const updated = await this.prisma.vocabularyEntry.updateMany({
      where: { id: entryId, userId },
      data: { favorite },
    });
    if (!updated.count) return null;
    return this.prisma.vocabularyEntry.findUnique({
      where: { id: entryId },
      select: vocabularySelect,
    });
  }

  async review(userId: string, entryId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const entry = await transaction.vocabularyEntry.findFirst({
        where: { id: entryId, userId },
        select: { id: true, reviewCount: true },
      });
      if (!entry) return null;
      return transaction.vocabularyEntry.update({
        where: { id: entry.id },
        data: { reviewCount: Math.min(3, entry.reviewCount + 1) },
        select: vocabularySelect,
      });
    });
  }
}

const vocabularySelect = {
  id: true,
  conversationId: true,
  sceneId: true,
  phrase: true,
  meaningZh: true,
  meaningEn: true,
  example: true,
  favorite: true,
  reviewCount: true,
  createdAt: true,
} as const;
