import {
  conversationListQuerySchema,
  createConversationSchema,
} from "@/features/conversation/server-contracts";
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

export async function GET(request: Request) {
  const userId = await getRequiredUserId();
  if (typeof userId !== "string") {
    return userId;
  }
  const input = conversationListQuerySchema.safeParse({
    limit: new URL(request.url).searchParams.get("limit") ?? undefined,
  });
  if (!input.success) {
    return fail(
      "CONVERSATION_LIST_INVALID_INPUT",
      "Conversation list parameters are invalid.",
    );
  }

  try {
    const prisma = getPrismaClient();
    const service = new ConversationService(
      new PrismaConversationRepository(prisma),
      new PrismaSceneRepository(prisma),
    );
    return ok(await service.listHistory(userId, input.data.limit));
  } catch (error) {
    reportServerError(
      "conversation.list_failed",
      "Unable to list conversations.",
      error,
      { userId },
    );
    return fail(
      "CONVERSATION_SERVICE_UNAVAILABLE",
      "Conversation history is temporarily unavailable.",
      503,
    );
  }
}

export async function POST(request: Request) {
  const userId = await getRequiredUserId();
  if (typeof userId !== "string") {
    return userId;
  }
  const input = createConversationSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!input.success) {
    return fail(
      "CONVERSATION_INVALID_INPUT",
      "Conversation parameters are invalid.",
    );
  }

  try {
    const prisma = getPrismaClient();
    const service = new ConversationService(
      new PrismaConversationRepository(prisma),
      new PrismaSceneRepository(prisma),
    );
    return ok(await service.create(userId, input.data.sceneId), 201);
  } catch (error) {
    const domainResponse = toDomainErrorResponse(error);
    if (domainResponse) {
      return domainResponse;
    }
    reportServerError(
      "conversation.create_failed",
      "Unable to create conversation.",
      error,
      { userId },
    );
    return fail(
      "CONVERSATION_SERVICE_UNAVAILABLE",
      "Conversation service is temporarily unavailable.",
      503,
    );
  }
}
