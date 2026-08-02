import { getRequiredUserId, toDomainErrorResponse } from "@/features/conversation/server-route";
import {
  createMistakeSchema,
  mistakeListQuerySchema,
} from "@/features/mistakes/server-contracts";
import { getPrismaClient } from "@/infrastructure/database/prisma";
import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";
import { PrismaMistakeRepository } from "@/repositories/mistake.repository";
import { MistakeService } from "@/services/learning/mistake.service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await getRequiredUserId();
  if (typeof userId !== "string") return userId;
  const input = mistakeListQuerySchema.safeParse({
    limit: new URL(request.url).searchParams.get("limit") ?? undefined,
  });
  if (!input.success) {
    return fail("MISTAKE_LIST_INVALID_INPUT", "Mistake list parameters are invalid.");
  }
  try {
    const service = new MistakeService(
      new PrismaMistakeRepository(getPrismaClient()),
    );
    return ok(await service.list(userId, input.data.limit));
  } catch (error) {
    reportServerError("mistakes.list_failed", "Unable to list mistakes.", error, { userId });
    return fail("MISTAKE_SERVICE_UNAVAILABLE", "Mistakes are temporarily unavailable.", 503);
  }
}

export async function POST(request: Request) {
  const userId = await getRequiredUserId();
  if (typeof userId !== "string") return userId;
  const input = createMistakeSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return fail("MISTAKE_INVALID_INPUT", "Mistake parameters are invalid.");
  }
  try {
    const service = new MistakeService(
      new PrismaMistakeRepository(getPrismaClient()),
    );
    return ok(await service.create(userId, input.data), 201);
  } catch (error) {
    const domainResponse = toDomainErrorResponse(error);
    if (domainResponse) return domainResponse;
    reportServerError("mistakes.create_failed", "Unable to save a mistake.", error, { userId });
    return fail("MISTAKE_SAVE_FAILED", "Unable to save the mistake.", 503);
  }
}
