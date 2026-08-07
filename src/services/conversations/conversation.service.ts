import type { SceneRepository } from "@/repositories/scene.repository";
import type {
  ConversationRepository,
  CreateMessageRecord,
} from "@/repositories/prisma-conversation.repository";
import { DomainError } from "@/lib/domain-error";

export class ConversationService {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly scenes: SceneRepository,
  ) {}

  async create(userId: string, sceneIdentifier: string) {
    const scene = await this.scenes.findActiveByIdentifier(sceneIdentifier);
    if (!scene) {
      throw new DomainError("SCENE_NOT_FOUND", "Scene not found.", 404);
    }
    return this.conversations.create(userId, scene.id);
  }

  async get(userId: string, conversationId: string) {
    const conversation = await this.conversations.findOwnedById(
      conversationId,
      userId,
    );
    if (!conversation) {
      throw new DomainError(
        "CONVERSATION_NOT_FOUND",
        "Conversation not found.",
        404,
      );
    }
    return conversation;
  }

  async addMessage(
    userId: string,
    conversationId: string,
    input: CreateMessageRecord,
  ) {
    const message = await this.conversations.appendMessage(
      conversationId,
      userId,
      input,
    );
    if (!message) {
      throw new DomainError(
        "CONVERSATION_NOT_ACTIVE",
        "Conversation is missing or no longer active.",
        409,
      );
    }
    return message;
  }

  async complete(
    userId: string,
    conversationId: string,
    input: {
      durationSeconds?: number;
      summary?: string;
      newExpressions?: number;
      corrections?: number;
      mastery?: number;
    },
  ) {
    const conversation = await this.get(userId, conversationId);
    if (conversation.status === "COMPLETED") {
      return conversation;
    }
    if (conversation.status !== "ACTIVE") {
      throw new DomainError(
        "CONVERSATION_NOT_ACTIVE",
        "Conversation is no longer active.",
        409,
      );
    }
    const elapsedSeconds = Math.max(
      0,
      Math.round((Date.now() - conversation.startedAt.getTime()) / 1_000),
    );
    // Duration is derived from the server-owned start time. Client duration is
    // retained in the contract for guest/offline compatibility, but is not trusted.
    const durationSeconds = Math.min(60 * 60, elapsedSeconds);
    const completed = await this.conversations.complete(
      conversationId,
      userId,
      durationSeconds,
      input.summary,
      {
        newExpressions: input.newExpressions,
        corrections: input.corrections,
        mastery: input.mastery,
      },
    );
    if (!completed) {
      throw new DomainError(
        "CONVERSATION_NOT_FOUND",
        "Conversation not found.",
        404,
      );
    }
    return completed;
  }

  async listHistory(userId: string, limit: number) {
    return (await this.conversations.listCompleted(userId, limit)).map(
      toPracticeRecord,
    );
  }

  async listHistoryBetween(
    userId: string,
    start: Date,
    end: Date,
  ) {
    return (
      await this.conversations.listCompletedBetween(userId, start, end)
    ).map(toPracticeRecord);
  }
}

function toPracticeRecord(
  conversation: Awaited<
    ReturnType<ConversationRepository["listCompleted"]>
  >[number],
) {
  return {
    id: `practice-${conversation.id}`,
    conversationId: conversation.id,
    sceneId: conversation.sceneId!,
    completedAt: conversation.endedAt!.toISOString(),
    durationMinutes: Math.max(
      1,
      Math.round((conversation.durationSeconds ?? 0) / 60),
    ),
    newExpressions: conversation.newExpressions,
    corrections: conversation.corrections,
    mastery: conversation.mastery ?? 50,
  };
}
