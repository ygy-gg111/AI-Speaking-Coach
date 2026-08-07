import { completeConversationSchema } from "@/features/conversation/server-contracts";
import { conversationReviewSchema } from "@/ai/evaluation/conversation-review";
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
  const input = completeConversationSchema.safeParse(
    await request.json().catch(() => ({})),
  );
  if (!conversationId || conversationId.length > 128 || !input.success) {
    return fail(
      "CONVERSATION_COMPLETE_INVALID_INPUT",
      "Completion parameters are invalid.",
    );
  }

  try {
    const prisma = getPrismaClient();
    const service = new ConversationService(
      new PrismaConversationRepository(prisma),
      new PrismaSceneRepository(prisma),
    );
    const latestReview = await prisma.analysisJob.findFirst({
      where: {
        conversationId,
        type: "conversation_review",
        status: "COMPLETED",
        conversation: { userId },
      },
      orderBy: { createdAt: "desc" },
      select: { result: true },
    });
    const stored = latestReview?.result as { evaluation?: unknown } | null;
    const evaluation = conversationReviewSchema.safeParse(stored?.evaluation);
    const trustedInput = evaluation.success
      ? {
          ...input.data,
          summary: evaluation.data.improved,
          newExpressions: evaluation.data.newExpressions,
          corrections: evaluation.data.corrections,
          mastery: Math.max(
            35,
            Math.min(
              95,
              78 - evaluation.data.corrections * 4 + evaluation.data.newExpressions,
            ),
          ),
        }
      : input.data;
    return ok(
      await service.complete(userId, conversationId, trustedInput),
    );
  } catch (error) {
    const domainResponse = toDomainErrorResponse(error);
    if (domainResponse) {
      return domainResponse;
    }
    reportServerError(
      "conversation.complete_failed",
      "Unable to complete conversation.",
      error,
      { userId, conversationId },
    );
    return fail(
      "CONVERSATION_COMPLETE_FAILED",
      "Unable to complete the conversation.",
      503,
    );
  }
}
