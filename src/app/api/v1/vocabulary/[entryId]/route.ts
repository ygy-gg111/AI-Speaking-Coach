import { getRequiredUserId, toDomainErrorResponse } from "@/features/conversation/server-route";
import { updateVocabularySchema } from "@/features/vocabulary/server-contracts";
import { getPrismaClient } from "@/infrastructure/database/prisma";
import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";
import { PrismaVocabularyRepository } from "@/repositories/vocabulary.repository";
import { VocabularyService } from "@/services/learning/vocabulary.service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ entryId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const userId = await getRequiredUserId();
  if (typeof userId !== "string") return userId;
  const { entryId } = await context.params;
  const input = updateVocabularySchema.safeParse(await request.json().catch(() => null));
  if (!entryId || entryId.length > 128 || !input.success) {
    return fail("VOCABULARY_UPDATE_INVALID_INPUT", "Vocabulary update parameters are invalid.");
  }
  try {
    return ok(
      await new VocabularyService(
        new PrismaVocabularyRepository(getPrismaClient()),
      ).update(userId, entryId, input.data),
    );
  } catch (error) {
    const domainResponse = toDomainErrorResponse(error);
    if (domainResponse) return domainResponse;
    reportServerError("vocabulary.update_failed", "Unable to update vocabulary.", error, { userId, entryId });
    return fail("VOCABULARY_UPDATE_FAILED", "Unable to update vocabulary.", 503);
  }
}
