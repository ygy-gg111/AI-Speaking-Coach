import {
  ConversationStatus,
  RealtimeSessionStatus,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";

export type RealtimeLearnerContext = {
  sceneName: string;
  learnerLevel: string;
  voice: string;
  speed: number;
  correctionFrequency: string;
  learningGoal: string;
  showChinese: boolean;
};

export interface RealtimeSessionRepository {
  getLearnerContext(
    conversationId: string,
    userId: string,
  ): Promise<RealtimeLearnerContext | null>;
  create(
    conversationId: string,
    userId: string,
    configuration: Prisma.InputJsonValue,
  ): Promise<{ id: string } | null>;
  markConnected(
    sessionId: string,
    userId: string,
    providerSessionId?: string,
  ): Promise<boolean>;
  finish(
    sessionId: string,
    userId: string,
    status: "COMPLETED" | "FAILED",
  ): Promise<boolean>;
}

export class PrismaRealtimeSessionRepository
  implements RealtimeSessionRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async getLearnerContext(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
        status: ConversationStatus.ACTIVE,
      },
      select: {
        scene: { select: { slug: true } },
        user: {
          select: {
            profile: {
              select: {
                level: true,
                voice: true,
                speechSpeed: true,
                correctionFrequency: true,
                learningGoal: true,
                showChinese: true,
              },
            },
          },
        },
      },
    });
    if (!conversation?.scene) {
      return null;
    }

    return {
      sceneName: conversation.scene.slug.replaceAll("-", " "),
      learnerLevel: conversation.user.profile?.level ?? "A2",
      voice: conversation.user.profile?.voice ?? "marin",
      speed: conversation.user.profile?.speechSpeed ?? 1,
      correctionFrequency:
        conversation.user.profile?.correctionFrequency ?? "balanced",
      learningGoal: conversation.user.profile?.learningGoal ?? "daily",
      showChinese: conversation.user.profile?.showChinese ?? true,
    };
  }

  async create(
    conversationId: string,
    userId: string,
    configuration: Prisma.InputJsonValue,
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
      return transaction.realtimeSession.create({
        data: { conversationId, configuration },
        select: { id: true },
      });
    });
  }

  async markConnected(
    sessionId: string,
    userId: string,
    providerSessionId?: string,
  ) {
    const result = await this.prisma.realtimeSession.updateMany({
      where: {
        id: sessionId,
        status: RealtimeSessionStatus.CREATED,
        conversation: { userId },
      },
      data: {
        status: RealtimeSessionStatus.CONNECTED,
        providerSessionId,
      },
    });
    return result.count > 0;
  }

  async finish(
    sessionId: string,
    userId: string,
    status: "COMPLETED" | "FAILED",
  ) {
    const result = await this.prisma.realtimeSession.updateMany({
      where: {
        id: sessionId,
        status: {
          in: [
            RealtimeSessionStatus.CREATED,
            RealtimeSessionStatus.CONNECTED,
          ],
        },
        conversation: { userId },
      },
      data: {
        status:
          status === "COMPLETED"
            ? RealtimeSessionStatus.COMPLETED
            : RealtimeSessionStatus.FAILED,
        endedAt: new Date(),
      },
    });
    return result.count > 0;
  }
}
