import { createMessageSchema } from "@/features/conversation/server-contracts";
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

export async function POST(request: Request, context: RouteContext) {
  const userId = await getRequiredUserId();
  if (typeof userId !== "string") {
    return userId;
  }
  const { conversationId } = await context.params;
  const input = createMessageSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!conversationId || conversationId.length > 128 || !input.success) {
    return fail(
      "MESSAGE_INVALID_INPUT",
      "Message parameters are invalid.",
    );
  }

  try {
    const prisma = getPrismaClient();
    const service = new ConversationService(
      new PrismaConversationRepository(prisma),
      new PrismaSceneRepository(prisma),
    );
    return ok(
      await service.addMessage(userId, conversationId, input.data),
      201,
    );
  } catch (error) {
    const domainResponse = toDomainErrorResponse(error);
    if (domainResponse) {
      return domainResponse;
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return fail(
        "MESSAGE_DUPLICATE_EVENT",
        "This message event was already stored.",
        409,
      );
    }
    reportServerError(
      "conversation.message_save_failed",
      "Unable to save conversation message.",
      error,
      { userId, conversationId },
    );
    return fail(
      "MESSAGE_SAVE_FAILED",
      "Unable to save the conversation message.",
      503,
    );
  }
}
import { Prisma } from "@prisma/client";
