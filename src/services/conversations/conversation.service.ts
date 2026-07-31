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
    input: { durationSeconds?: number; summary?: string },
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
    const durationSeconds = Math.min(
      60 * 60,
      input.durationSeconds ?? elapsedSeconds,
    );
    const completed = await this.conversations.complete(
      conversationId,
      userId,
      durationSeconds,
      input.summary,
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
}
