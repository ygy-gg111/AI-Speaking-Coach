import OpenAI from "openai";
import { z } from "zod";

import { getRequiredUserId } from "@/features/conversation/server-route";
import { scorePronunciation } from "@/features/realtime/pronunciation-score";
import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";
import { getServerEnv } from "@/lib/env";
import { consumeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const fieldsSchema = z.object({
  target: z.string().trim().min(1).max(500),
  durationMs: z.coerce.number().int().min(250).max(60_000),
  pauseRatio: z.coerce.number().min(0).max(1),
  energyVariation: z.coerce.number().min(0).max(1),
});

export async function POST(request: Request) {
  const userId = await getRequiredUserId();
  if (typeof userId !== "string") return userId;
  if (!consumeRateLimit(`pronunciation:${userId}`, 20, 60_000).allowed) {
    return fail("PRONUNCIATION_RATE_LIMIT", "Too many pronunciation requests.", 429);
  }

  const form = await request.formData().catch(() => null);
  if (!form) return fail("PRONUNCIATION_INVALID_INPUT", "Invalid recording payload.");
  const audio = form.get("audio");
  const fields = fieldsSchema.safeParse({
    target: form.get("target"),
    durationMs: form.get("durationMs"),
    pauseRatio: form.get("pauseRatio"),
    energyVariation: form.get("energyVariation"),
  });
  if (
    !(audio instanceof File) ||
    !audio.type.startsWith("audio/") ||
    audio.size === 0 ||
    audio.size > 10 * 1024 * 1024 ||
    !fields.success
  ) {
    return fail("PRONUNCIATION_INVALID_INPUT", "Recording parameters are invalid.");
  }

  const env = getServerEnv();
  if (!env.OPENAI_API_KEY) {
    return fail("PRONUNCIATION_NOT_CONFIGURED", "Audio transcription is not configured.", 503);
  }

  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "gpt-transcribe",
      prompt: `English learner repeating this target sentence: ${fields.data.target}`,
    }, { signal: AbortSignal.timeout(25_000) });
    return ok(scorePronunciation(fields.data.target, transcription.text, fields.data));
  } catch (error) {
    reportServerError(
      "ai.pronunciation_evaluation_failed",
      "Pronunciation evaluation failed.",
      error,
      { userId },
    );
    return fail("PRONUNCIATION_UNAVAILABLE", "Pronunciation evaluation is temporarily unavailable.", 502);
  }
}
