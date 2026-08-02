import { getRequiredUserId } from "@/features/conversation/server-route";
import {
  getReportHistoryRange,
  reportQuerySchema,
} from "@/features/learning/server-contracts";
import { buildLearningReport } from "@/features/reports/report-data";
import { getPrismaClient } from "@/infrastructure/database/prisma";
import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";
import { PrismaConversationRepository } from "@/repositories/prisma-conversation.repository";
import { PrismaMistakeRepository } from "@/repositories/mistake.repository";
import { PrismaSceneRepository } from "@/repositories/scene.repository";
import { ConversationService } from "@/services/conversations/conversation.service";
import { MistakeService } from "@/services/learning/mistake.service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await getRequiredUserId();
  if (typeof userId !== "string") {
    return userId;
  }
  const search = new URL(request.url).searchParams;
  const input = reportQuerySchema.safeParse({
    period: search.get("period"),
    timezoneOffset: search.get("timezoneOffset") ?? undefined,
  });
  if (!input.success) {
    return fail("REPORT_INVALID_INPUT", "Report parameters are invalid.");
  }

  try {
    const now = new Date();
    const { start, end } = getReportHistoryRange(
      input.data.period,
      input.data.timezoneOffset,
      now,
    );
    const prisma = getPrismaClient();
    const service = new ConversationService(
      new PrismaConversationRepository(prisma),
      new PrismaSceneRepository(prisma),
    );
    const records = await service.listHistoryBetween(userId, start, end);
    const mistakes = await new MistakeService(
      new PrismaMistakeRepository(prisma),
    ).list(userId);
    return ok(
      buildLearningReport(
        records,
        mistakes,
        input.data.period,
        now,
        input.data.timezoneOffset,
      ),
    );
  } catch (error) {
    reportServerError(
      "reports.load_failed",
      "Unable to load the learning report.",
      error,
      { userId, period: input.data.period },
    );
    return fail(
      "REPORT_SERVICE_UNAVAILABLE",
      "Learning report is temporarily unavailable.",
      503,
    );
  }
}
