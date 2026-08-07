import { completeConversationSchema } from "@/features/conversation/server-contracts";
import { conversationReviewSchema } from "@/ai/evaluation/conversation-review";
import {
  getRequiredUserId,
  toDomainErrorResponse,
} from "@/features/conversation/server-route";
import { getPrismaClient } from "@/infrastructure/database/prisma";
import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";
import { DomainError } from "@/lib/domain-error";
import { ConversationStatus, MistakeCategory } from "@prisma/client";

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
    const completed = await prisma.$transaction(async (transaction) => {
      const conversation = await transaction.conversation.findFirst({
        where: { id: conversationId, userId },
        include: {
          scene: true,
          messages: { orderBy: { sequence: "asc" } },
        },
      });
      if (!conversation) return null;
      if (conversation.status !== ConversationStatus.COMPLETED) {
        if (conversation.status !== ConversationStatus.ACTIVE) {
          throw new DomainError(
            "CONVERSATION_NOT_ACTIVE",
            "Conversation is no longer active.",
            409,
          );
        }
        const elapsedSeconds = Math.min(
          60 * 60,
          Math.max(0, Math.round((Date.now() - conversation.startedAt.getTime()) / 1_000)),
        );
        await transaction.conversation.update({
          where: { id: conversation.id },
          data: {
            status: ConversationStatus.COMPLETED,
            endedAt: new Date(),
            durationSeconds: elapsedSeconds,
            summary: trustedInput.summary,
            newExpressions: trustedInput.newExpressions,
            corrections: trustedInput.corrections,
            mastery: trustedInput.mastery,
          },
        });
      }
      if (evaluation.success && conversation.sceneId) {
        await transaction.mistake.upsert({
          where: { conversationId },
          update: {
            original: evaluation.data.original,
            improved: evaluation.data.improved,
            reasonZh: evaluation.data.reason["zh-CN"],
            reasonEn: evaluation.data.reason.en,
            category: MistakeCategory.EXPRESSION,
          },
          create: {
            userId,
            conversationId,
            sceneId: conversation.sceneId,
            original: evaluation.data.original,
            improved: evaluation.data.improved,
            reasonZh: evaluation.data.reason["zh-CN"],
            reasonEn: evaluation.data.reason.en,
            category: MistakeCategory.EXPRESSION,
          },
        });
        await transaction.vocabularyEntry.upsert({
          where: { userId_phrase: { userId, phrase: evaluation.data.improved } },
          update: {
            conversationId,
            sceneId: conversation.sceneId,
            meaningZh: evaluation.data.reason["zh-CN"],
            meaningEn: evaluation.data.reason.en,
            example: evaluation.data.improved,
          },
          create: {
            userId,
            conversationId,
            sceneId: conversation.sceneId,
            phrase: evaluation.data.improved,
            meaningZh: evaluation.data.reason["zh-CN"],
            meaningEn: evaluation.data.reason.en,
            example: evaluation.data.improved,
          },
        });
      }
      return transaction.conversation.findUnique({
        where: { id: conversationId },
        include: {
          scene: true,
          messages: { orderBy: { sequence: "asc" } },
        },
      });
    });
    if (!completed) return fail("CONVERSATION_NOT_FOUND", "Conversation not found.", 404);
    return ok(completed);
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
