import { z } from "zod";

import { fail, ok } from "@/lib/api-response";
import { getServerEnv } from "@/lib/env";

const requestSchema = z.object({
  conversationId: z.string().min(1),
  sceneId: z.string().min(1).optional(),
  level: z.string().default("A2"),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return fail("INVALID_REQUEST", "Realtime session parameters are invalid.");
  }

  const env = getServerEnv();
  if (!env.OPENAI_API_KEY) {
    return fail(
      "REALTIME_NOT_CONFIGURED",
      "Set OPENAI_API_KEY before creating a realtime voice session.",
      503,
    );
  }

  return ok(
    {
      ...parsed.data,
      model: env.OPENAI_REALTIME_MODEL,
      voice: env.OPENAI_REALTIME_VOICE,
      status: "contract-ready",
      nextStep:
        "Exchange this server-side request for an ephemeral Realtime client secret.",
    },
    202,
  );
}
