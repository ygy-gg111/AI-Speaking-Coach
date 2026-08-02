import type { Prisma } from "@prisma/client";

import { DomainError } from "@/lib/domain-error";
import type { RealtimeSessionRepository } from "@/repositories/realtime-session.repository";

export class RealtimeSessionService {
  constructor(private readonly sessions: RealtimeSessionRepository) {}

  async getContext(userId: string, conversationId: string) {
    const context = await this.sessions.getLearnerContext(
      conversationId,
      userId,
    );
    if (!context) {
      throw new DomainError(
        "CONVERSATION_NOT_ACTIVE",
        "Conversation is missing or no longer active.",
        409,
      );
    }
    return context;
  }

  async create(
    userId: string,
    conversationId: string,
    configuration: Prisma.InputJsonValue,
  ) {
    const session = await this.sessions.create(
      conversationId,
      userId,
      configuration,
    );
    if (!session) {
      throw new DomainError(
        "CONVERSATION_NOT_ACTIVE",
        "Conversation is missing or no longer active.",
        409,
      );
    }
    return session;
  }

  markConnected(
    userId: string,
    sessionId: string,
    providerSessionId?: string,
  ) {
    return this.sessions.markConnected(
      sessionId,
      userId,
      providerSessionId,
    );
  }

  async finish(
    userId: string,
    sessionId: string,
    status: "COMPLETED" | "FAILED",
  ) {
    const updated = await this.sessions.finish(sessionId, userId, status);
    if (!updated) {
      throw new DomainError(
        "REALTIME_SESSION_NOT_FOUND",
        "Realtime session not found or already ended.",
        404,
      );
    }
    return { id: sessionId, status };
  }
}
