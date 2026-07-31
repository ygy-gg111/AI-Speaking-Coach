import {
  getRequiredUserId,
  toDomainErrorResponse,
} from "@/features/conversation/server-route";
import { getPrismaClient } from "@/infrastructure/database/prisma";
import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";
import { PrismaConversationRepository } from "@/repositories/prisma-conversation.repository";
import { PrismaSceneRepository } from "@/repositories/scene.repository";
import { ConversationService } from "@/services/conversations/conversation.service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const userId = await getRequiredUserId();
  if (typeof userId !== "string") {
    return userId;
  }
  const { conversationId } = await context.params;
  if (!conversationId || conversationId.length > 128) {
    return fail(
      "CONVERSATION_INVALID_ID",
      "Conversation identifier is invalid.",
    );
  }

  try {
    const prisma = getPrismaClient();
    const service = new ConversationService(
      new PrismaConversationRepository(prisma),
      new PrismaSceneRepository(prisma),
    );
    return ok(await service.get(userId, conversationId));
  } catch (error) {
    const domainResponse = toDomainErrorResponse(error);
    if (domainResponse) {
      return domainResponse;
    }
    reportServerError(
      "conversation.load_failed",
      "Unable to load conversation.",
      error,
      { userId, conversationId },
    );
    return fail(
      "CONVERSATION_SERVICE_UNAVAILABLE",
      "Conversation service is temporarily unavailable.",
      503,
    );
  }
}
