import { getRequiredUserId } from "@/features/conversation/server-route";
import {
  calendarDateParamsSchema,
  getLocalDateRange,
} from "@/features/learning/server-contracts";
import { getPrismaClient } from "@/infrastructure/database/prisma";
import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";
import { PrismaConversationRepository } from "@/repositories/prisma-conversation.repository";
import { PrismaSceneRepository } from "@/repositories/scene.repository";
import { ConversationService } from "@/services/conversations/conversation.service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ date: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const userId = await getRequiredUserId();
  if (typeof userId !== "string") {
    return userId;
  }
  const { date } = await context.params;
  const input = calendarDateParamsSchema.safeParse({
    date,
    timezoneOffset:
      new URL(request.url).searchParams.get("timezoneOffset") ?? undefined,
  });
  if (!input.success) {
    return fail("CALENDAR_DATE_INVALID", "Calendar date is invalid.");
  }

  try {
    const { start, end } = getLocalDateRange(
      input.data.date,
      input.data.timezoneOffset,
    );
    const prisma = getPrismaClient();
    const service = new ConversationService(
      new PrismaConversationRepository(prisma),
      new PrismaSceneRepository(prisma),
    );
    return ok({
      date: input.data.date,
      records: await service.listHistoryBetween(userId, start, end),
    });
  } catch (error) {
    reportServerError(
      "calendar.date_load_failed",
      "Unable to load daily learning records.",
      error,
      { userId, date },
    );
    return fail(
      "CALENDAR_SERVICE_UNAVAILABLE",
      "Daily learning records are temporarily unavailable.",
      503,
    );
  }
}
