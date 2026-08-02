import { z } from "zod";

import { getSessionUserId } from "@/features/auth/session";
import { getPrismaClient } from "@/infrastructure/database/prisma";
import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";
import { DomainError } from "@/lib/domain-error";
import { PrismaRealtimeSessionRepository } from "@/repositories/realtime-session.repository";
import { RealtimeSessionService } from "@/services/realtime/realtime-session.service";

const updateSchema = z.object({
  status: z.enum(["COMPLETED", "FAILED"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const input = updateSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return fail("REALTIME_INVALID_STATUS", "Session status is invalid.", 400);
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return fail("AUTH_UNAUTHORIZED", "Please log in to continue.", 401);
  }
  const { sessionId } = await context.params;

  try {
    const service = new RealtimeSessionService(
      new PrismaRealtimeSessionRepository(getPrismaClient()),
    );
    return ok(await service.finish(userId, sessionId, input.data.status));
  } catch (error) {
    if (error instanceof DomainError) {
      return fail(error.code, error.message, error.status);
    }
    reportServerError(
      "ai.realtime_session_finish_failed",
      "Unable to finish the realtime session.",
      error,
      { sessionId, userId },
    );
    return fail(
      "REALTIME_SESSION_UPDATE_FAILED",
      "Realtime session status is temporarily unavailable.",
      503,
    );
  }
}
