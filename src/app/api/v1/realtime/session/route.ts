import { z } from "zod";

import { createRealtimeSessionConfig } from "@/ai/realtime/session-config";
import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";
import { getServerEnv } from "@/lib/env";

const requestSchema = z.object({
  conversationId: z.string().min(1),
  sceneName: z.string().min(1).max(120),
  level: z.string().default("A2"),
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
    sceneName: url.searchParams.get("sceneName"),
    level: url.searchParams.get("level") ?? undefined,
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

  const session = createRealtimeSessionConfig({
    sceneName: parsed.data.sceneName,
    learnerLevel: parsed.data.level,
  });
  const formData = new FormData();
  formData.set("sdp", sdp);
  formData.set("session", JSON.stringify(session));

  try {
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

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/sdp",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
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
