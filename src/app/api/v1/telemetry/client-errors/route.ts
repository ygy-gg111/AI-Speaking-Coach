import { z } from "zod";

import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";

const clientErrorSchema = z.object({
  name: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(2_000),
  stack: z.string().max(8_000).optional(),
  digest: z.string().max(200).optional(),
  path: z.string().trim().min(1).max(500),
  locale: z.enum(["zh-CN", "en"]),
});

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return fail("TELEMETRY_ORIGIN_REJECTED", "Invalid request origin.", 403);
  }
  const parsed = clientErrorSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return fail("TELEMETRY_INVALID_EVENT", "Invalid client error event.", 400);
  }
  reportServerError(
    "client.render_error",
    "A client-side route error was reported.",
    new Error(parsed.data.message),
    {
      name: parsed.data.name,
      stack: parsed.data.stack,
      digest: parsed.data.digest,
      path: parsed.data.path,
      locale: parsed.data.locale,
    },
  );
  return ok({ accepted: true as const }, 202);
}
