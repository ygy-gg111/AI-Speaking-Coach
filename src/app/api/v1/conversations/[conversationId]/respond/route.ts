import OpenAI from "openai";
import { z } from "zod";

import {
  getRequiredUserId,
  toDomainErrorResponse,
} from "@/features/conversation/server-route";
import { getPrismaClient } from "@/infrastructure/database/prisma";
import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";
import { getServerEnv } from "@/lib/env";
import { consumeRateLimit } from "@/lib/rate-limit";
import { PrismaConversationRepository } from "@/repositories/prisma-conversation.repository";
import { PrismaSceneRepository } from "@/repositories/scene.repository";
import { ConversationService } from "@/services/conversations/conversation.service";

const requestSchema = z.object({ text: z.string().trim().min(1).max(2_000) });
type RouteContext = { params: Promise<{ conversationId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const userId = await getRequiredUserId();
  if (typeof userId !== "string") return userId;
  if (!consumeRateLimit(`text-response:${userId}`, 30, 60_000).allowed) {
    return fail("TEXT_RESPONSE_RATE_LIMIT", "Too many text messages.", 429);
  }
  const { conversationId } = await context.params;
  const input = requestSchema.safeParse(await request.json().catch(() => null));
  if (!conversationId || !input.success) {
    return fail(
      "TEXT_RESPONSE_INVALID_INPUT",
      "Text response parameters are invalid.",
    );
  }

  try {
    const prisma = getPrismaClient();
    const conversation = await new ConversationService(
      new PrismaConversationRepository(prisma),
      new PrismaSceneRepository(prisma),
    ).get(userId, conversationId);
    if (conversation.status !== "ACTIVE" || !conversation.scene) {
      return fail(
        "CONVERSATION_NOT_ACTIVE",
        "Conversation is no longer active.",
        409,
      );
    }
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { level: true },
    });
    const env = getServerEnv();
    if (!env.OPENAI_API_KEY) {
      return ok({
        text: `I understood: "${input.data.text}". Try adding one more detail.`,
        source: "fallback" as const,
      });
    }
    const response = await new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    }).responses.create(
      {
        model: env.OPENAI_TEXT_MODEL,
        instructions: [
          `Role-play the scene: ${conversation.scene.slug.replaceAll("-", " ")}.`,
          `The learner is level ${profile?.level ?? "A2"}.`,
          "Reply in natural, concise English with one or two sentences.",
          "Stay in character and do not provide grading or meta commentary.",
        ].join(" "),
        input: input.data.text,
      },
      { signal: AbortSignal.timeout(20_000) },
    );
    const text = response.output_text.trim();
    if (!text) throw new Error("Text model returned an empty response.");
    return ok({ text, source: "ai" as const });
  } catch (error) {
    const domainResponse = toDomainErrorResponse(error);
    if (domainResponse) return domainResponse;
    reportServerError(
      "ai.text_response_failed",
      "Text fallback response failed.",
      error,
      { userId, conversationId },
    );
    return fail(
      "TEXT_RESPONSE_UNAVAILABLE",
      "Text practice is temporarily unavailable.",
      502,
    );
  }
}
