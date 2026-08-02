import { getRequiredUserId, toDomainErrorResponse } from "@/features/conversation/server-route";
import { getPrismaClient } from "@/infrastructure/database/prisma";
import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";
import { PrismaMistakeRepository } from "@/repositories/mistake.repository";
import { MistakeService } from "@/services/learning/mistake.service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ mistakeId: string }> };

export async function POST(_: Request, context: RouteContext) {
  const userId = await getRequiredUserId();
  if (typeof userId !== "string") return userId;
  const { mistakeId } = await context.params;
  if (!mistakeId || mistakeId.length > 128) {
    return fail("MISTAKE_REVIEW_INVALID_INPUT", "Mistake identifier is invalid.");
  }
  try {
    const service = new MistakeService(
      new PrismaMistakeRepository(getPrismaClient()),
    );
    return ok(await service.review(userId, mistakeId));
  } catch (error) {
    const domainResponse = toDomainErrorResponse(error);
    if (domainResponse) return domainResponse;
    reportServerError("mistakes.review_failed", "Unable to review a mistake.", error, { userId, mistakeId });
    return fail("MISTAKE_REVIEW_FAILED", "Unable to update the mistake.", 503);
  }
}
