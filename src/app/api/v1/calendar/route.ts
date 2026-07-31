import { getRequiredUserId } from "@/features/conversation/server-route";
import {
  calendarMonthQuerySchema,
  getLocalMonthRange,
} from "@/features/learning/server-contracts";
import { getPrismaClient } from "@/infrastructure/database/prisma";
import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";
import { PrismaConversationRepository } from "@/repositories/prisma-conversation.repository";
import { PrismaSceneRepository } from "@/repositories/scene.repository";
import { ConversationService } from "@/services/conversations/conversation.service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await getRequiredUserId();
  if (typeof userId !== "string") {
    return userId;
  }
  const search = new URL(request.url).searchParams;
  const input = calendarMonthQuerySchema.safeParse({
    year: search.get("year"),
    month: search.get("month"),
    timezoneOffset: search.get("timezoneOffset") ?? undefined,
  });
  if (!input.success) {
    return fail("CALENDAR_INVALID_INPUT", "Calendar parameters are invalid.");
  }

  try {
    const { start, end } = getLocalMonthRange(
      input.data.year,
      input.data.month,
      input.data.timezoneOffset,
    );
    const prisma = getPrismaClient();
    const service = new ConversationService(
      new PrismaConversationRepository(prisma),
      new PrismaSceneRepository(prisma),
    );
    return ok({
      records: await service.listHistoryBetween(userId, start, end),
    });
  } catch (error) {
    reportServerError(
      "calendar.load_failed",
      "Unable to load the learning calendar.",
      error,
      { userId },
    );
    return fail(
      "CALENDAR_SERVICE_UNAVAILABLE",
      "Learning calendar is temporarily unavailable.",
      503,
    );
  }
}
