import { z } from "zod";
import type { Prisma } from "@prisma/client";

import { createRealtimeSessionConfig } from "@/ai/realtime/session-config";
import { getSessionUserId } from "@/features/auth/session";
import { getPrismaClient } from "@/infrastructure/database/prisma";
import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";
import { DomainError } from "@/lib/domain-error";
import { getServerEnv } from "@/lib/env";
import { PrismaRealtimeSessionRepository } from "@/repositories/realtime-session.repository";
import { RealtimeSessionService } from "@/services/realtime/realtime-session.service";

const requestSchema = z.object({
  conversationId: z.string().min(1),
});

export function GET() {
  const env = getServerEnv();
  const response = ok({
    configured: Boolean(env.OPENAI_API_KEY),
    model: env.OPENAI_REALTIME_MODEL,
    voice: env.OPENAI_REALTIME_VOICE,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type");
  if (!contentType?.startsWith("application/sdp")) {
    return fail("INVALID_CONTENT_TYPE", "Expected application/sdp.", 415);
  }

  const url = new URL(request.url);
  const parsed = requestSchema.safeParse({
    conversationId: url.searchParams.get("conversationId"),
  });

  if (!parsed.success) {
    return fail("INVALID_REQUEST", "Realtime session parameters are invalid.");
  }

  const sdp = await request.text();
  if (!sdp.trim() || sdp.length > 64_000) {
    return fail("INVALID_SDP", "The SDP offer is empty or too large.");
  }

  const env = getServerEnv();
  if (!env.OPENAI_API_KEY) {
    return fail(
      "REALTIME_NOT_CONFIGURED",
      "Set OPENAI_API_KEY before creating a realtime voice session.",
      503,
    );
  }

  const prisma = getPrismaClient();
  const lifecycle = new RealtimeSessionService(
    new PrismaRealtimeSessionRepository(prisma),
  );
  let userId: string | null = null;
  let lifecycleSessionId: string | null = null;

  try {
    userId = await getSessionUserId();
    if (!userId) {
      return fail("AUTH_UNAUTHORIZED", "Please log in to continue.", 401);
    }
    const context = await lifecycle.getContext(
      userId,
      parsed.data.conversationId,
    );
    const session = createRealtimeSessionConfig({
      sceneName: context.sceneName,
      learnerLevel: context.learnerLevel,
      voice: context.voice === "cedar" ? "cedar" : "marin",
      speed: context.speed,
      correctionFrequency:
        context.correctionFrequency === "gentle" ||
        context.correctionFrequency === "detailed"
          ? context.correctionFrequency
          : "balanced",
      learningGoal:
        context.learningGoal === "travel" ||
        context.learningGoal === "work" ||
        context.learningGoal === "interview"
          ? context.learningGoal
          : "daily",
      showChinese: context.showChinese,
    });
    const persistedSession = await lifecycle.create(
      userId,
      parsed.data.conversationId,
      JSON.parse(JSON.stringify(session)) as Prisma.InputJsonValue,
    );
    lifecycleSessionId = persistedSession.id;
    const formData = new FormData();
    formData.set("sdp", sdp);
    formData.set("session", JSON.stringify(session));

    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: formData,
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });

    const body = await response.text();
    if (!response.ok) {
      await lifecycle.finish(userId, lifecycleSessionId, "FAILED");
      lifecycleSessionId = null;
      reportServerError(
        "ai.realtime_upstream_error",
        "OpenAI Realtime session creation failed.",
        undefined,
        {
          status: response.status,
          conversationId: parsed.data.conversationId,
        },
      );
      return fail(
        "REALTIME_UPSTREAM_ERROR",
        "Unable to create the realtime voice session.",
        response.status >= 500 ? 502 : response.status,
      );
    }

    const providerSessionId = getProviderSessionId(
      response.headers.get("location"),
    );
    await lifecycle.markConnected(
      userId,
      lifecycleSessionId,
      providerSessionId,
    );

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/sdp",
        "Cache-Control": "no-store",
        "X-Realtime-Session-Id": lifecycleSessionId,
      },
    });
  } catch (error) {
    if (userId && lifecycleSessionId) {
      await lifecycle
        .finish(userId, lifecycleSessionId, "FAILED")
        .catch(() => undefined);
    }
    if (error instanceof DomainError) {
      return fail(error.code, error.message, error.status);
    }
    reportServerError(
      "ai.realtime_request_failed",
      "OpenAI Realtime request failed.",
      error,
      { conversationId: parsed.data.conversationId },
    );
    return fail(
      "REALTIME_UPSTREAM_UNAVAILABLE",
      "The realtime voice service is temporarily unavailable.",
      502,
    );
  }
}

function getProviderSessionId(location: string | null) {
  const id = location?.split("/").filter(Boolean).at(-1);
  return id && id.length <= 200 ? id : undefined;
}
