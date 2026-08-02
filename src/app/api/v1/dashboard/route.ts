import { buildDashboardSummary } from "@/features/dashboard/dashboard-data";
import { getRequiredUserId } from "@/features/conversation/server-route";
import { dashboardQuerySchema } from "@/features/learning/server-contracts";
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
  const input = dashboardQuerySchema.safeParse({
    timezoneOffset:
      new URL(request.url).searchParams.get("timezoneOffset") ?? undefined,
  });
  if (!input.success) {
    return fail("DASHBOARD_INVALID_INPUT", "Dashboard parameters are invalid.");
  }

  try {
    const prisma = getPrismaClient();
    const service = new ConversationService(
      new PrismaConversationRepository(prisma),
      new PrismaSceneRepository(prisma),
    );
    const records = await service.listHistory(userId, 1_000);
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { dailyGoalMinutes: true },
    });
    return ok(
      buildDashboardSummary(
        records,
        new Date(),
        input.data.timezoneOffset,
        profile?.dailyGoalMinutes ?? 10,
      ),
    );
  } catch (error) {
    reportServerError(
      "dashboard.load_failed",
      "Unable to load the dashboard.",
      error,
      { userId },
    );
    return fail(
      "DASHBOARD_SERVICE_UNAVAILABLE",
      "Dashboard data is temporarily unavailable.",
      503,
    );
  }
}
