import {
  ConversationStatus,
  MistakeCategory,
  MistakeStatus,
  type PrismaClient,
} from "@prisma/client";

export type MistakeRecordData = {
  id: string;
  conversationId: string;
  sceneId: string;
  original: string;
  improved: string;
  reasonZh: string;
  reasonEn: string;
  category: MistakeCategory;
  reviewCount: number;
  status: MistakeStatus;
  createdAt: Date;
};

export type CreateMistakeData = {
  conversationId: string;
  original: string;
  improved: string;
  reasonZh: string;
  reasonEn: string;
  category: MistakeCategory;
};

export interface MistakeRepository {
  list(userId: string, limit: number): Promise<MistakeRecordData[]>;
  createForConversation(
    userId: string,
    input: CreateMistakeData,
  ): Promise<MistakeRecordData | null>;
  review(userId: string, mistakeId: string): Promise<MistakeRecordData | null>;
}

export class PrismaMistakeRepository implements MistakeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list(userId: string, limit: number) {
    return this.prisma.mistake.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: mistakeSelect,
    });
  }

  async createForConversation(userId: string, input: CreateMistakeData) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: input.conversationId,
        userId,
        status: ConversationStatus.COMPLETED,
        sceneId: { not: null },
      },
      select: { id: true, sceneId: true },
    });
    if (!conversation?.sceneId) {
      return null;
    }
    return this.prisma.mistake.upsert({
      where: { conversationId: conversation.id },
      update: {
        original: input.original,
        improved: input.improved,
        reasonZh: input.reasonZh,
        reasonEn: input.reasonEn,
        category: input.category,
      },
      create: {
        userId,
        conversationId: conversation.id,
        sceneId: conversation.sceneId,
        original: input.original,
        improved: input.improved,
        reasonZh: input.reasonZh,
        reasonEn: input.reasonEn,
        category: input.category,
      },
      select: mistakeSelect,
    });
  }

  async review(userId: string, mistakeId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const mistake = await transaction.mistake.findFirst({
        where: { id: mistakeId, userId },
        select: { id: true, reviewCount: true },
      });
      if (!mistake) {
        return null;
      }
      const reviewCount = Math.min(3, mistake.reviewCount + 1);
      return transaction.mistake.update({
        where: { id: mistake.id },
        data: {
          reviewCount,
          status:
            reviewCount >= 3
              ? MistakeStatus.MASTERED
              : MistakeStatus.LEARNING,
        },
        select: mistakeSelect,
      });
    });
  }
}

const mistakeSelect = {
  id: true,
  conversationId: true,
  sceneId: true,
  original: true,
  improved: true,
  reasonZh: true,
  reasonEn: true,
  category: true,
  reviewCount: true,
  status: true,
  createdAt: true,
} as const;
