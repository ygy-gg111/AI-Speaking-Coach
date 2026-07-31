import {
  ConversationStatus,
  MessageRole,
  type PrismaClient,
} from "@prisma/client";

export type CreateMessageRecord = {
  clientEventId?: string;
  role: "USER" | "ASSISTANT";
  content: string;
  transcript?: string;
};

export type ConversationRecord = {
  id: string;
  userId: string;
  sceneId: string | null;
  status: ConversationStatus;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
  scene: {
    id: string;
    slug: string;
    titleKey: string;
    descriptionKey: string;
    category: string;
    difficulty: number;
  } | null;
  messages: MessageRecord[];
};

export type MessageRecord = {
  id: string;
  conversationId: string;
  clientEventId: string | null;
  role: MessageRole;
  content: string;
  transcript: string | null;
  sequence: number;
  createdAt: Date;
};

export interface ConversationRepository {
  create(userId: string, sceneId: string): Promise<ConversationRecord>;
  findOwnedById(
    id: string,
    userId: string,
  ): Promise<ConversationRecord | null>;
  appendMessage(
    conversationId: string,
    userId: string,
    input: CreateMessageRecord,
  ): Promise<MessageRecord | null>;
  complete(
    conversationId: string,
    userId: string,
    durationSeconds: number,
    summary?: string,
  ): Promise<ConversationRecord | null>;
}

export class PrismaConversationRepository
  implements ConversationRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  create(userId: string, sceneId: string) {
    return this.prisma.conversation.create({
      data: { userId, sceneId },
      include: {
        scene: { select: sceneSummarySelect },
        messages: { orderBy: { sequence: "asc" } },
      },
    });
  }

  findOwnedById(id: string, userId: string) {
    return this.prisma.conversation.findFirst({
      where: { id, userId },
      include: {
        scene: { select: sceneSummarySelect },
        messages: { orderBy: { sequence: "asc" } },
      },
    });
  }

  async appendMessage(
    conversationId: string,
    userId: string,
    input: CreateMessageRecord,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const conversation = await transaction.conversation.findFirst({
        where: {
          id: conversationId,
          userId,
          status: ConversationStatus.ACTIVE,
        },
        select: { id: true },
      });
      if (!conversation) {
        return null;
      }

      if (input.clientEventId) {
        const existing = await transaction.message.findFirst({
          where: {
            conversationId,
            clientEventId: input.clientEventId,
          },
        });
        if (existing) {
          return existing;
        }
      }

      const latest = await transaction.message.aggregate({
        where: { conversationId },
        _max: { sequence: true },
      });
      return transaction.message.create({
        data: {
          conversationId,
          clientEventId: input.clientEventId,
          role:
            input.role === "USER"
              ? MessageRole.USER
              : MessageRole.ASSISTANT,
          content: input.content,
          transcript: input.transcript,
          sequence: (latest._max.sequence ?? 0) + 1,
        },
      });
    });
  }

  async complete(
    conversationId: string,
    userId: string,
    durationSeconds: number,
    summary?: string,
  ) {
    const existing = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      select: { id: true, status: true },
    });
    if (!existing) {
      return null;
    }
    if (existing.status === ConversationStatus.COMPLETED) {
      return this.findOwnedById(conversationId, userId);
    }

    await this.prisma.conversation.updateMany({
      where: {
        id: conversationId,
        userId,
        status: ConversationStatus.ACTIVE,
      },
      data: {
        status: ConversationStatus.COMPLETED,
        endedAt: new Date(),
        durationSeconds,
        summary,
      },
    });
    return this.findOwnedById(conversationId, userId);
  }
}

const sceneSummarySelect = {
  id: true,
  slug: true,
  titleKey: true,
  descriptionKey: true,
  category: true,
  difficulty: true,
} as const;
