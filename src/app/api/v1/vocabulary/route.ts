import { getRequiredUserId, toDomainErrorResponse } from "@/features/conversation/server-route";
import {
  createVocabularySchema,
  vocabularyListQuerySchema,
} from "@/features/vocabulary/server-contracts";
import { getPrismaClient } from "@/infrastructure/database/prisma";
import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";
import { PrismaVocabularyRepository } from "@/repositories/vocabulary.repository";
import { VocabularyService } from "@/services/learning/vocabulary.service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await getRequiredUserId();
  if (typeof userId !== "string") return userId;
  const input = vocabularyListQuerySchema.safeParse({
    limit: new URL(request.url).searchParams.get("limit") ?? undefined,
  });
  if (!input.success) {
    return fail("VOCABULARY_LIST_INVALID_INPUT", "Vocabulary list parameters are invalid.");
  }
  try {
    return ok(
      await new VocabularyService(
        new PrismaVocabularyRepository(getPrismaClient()),
      ).list(userId, input.data.limit),
    );
  } catch (error) {
    reportServerError("vocabulary.list_failed", "Unable to list vocabulary.", error, { userId });
    return fail("VOCABULARY_SERVICE_UNAVAILABLE", "Vocabulary is temporarily unavailable.", 503);
  }
}

export async function POST(request: Request) {
  const userId = await getRequiredUserId();
  if (typeof userId !== "string") return userId;
  const input = createVocabularySchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return fail("VOCABULARY_INVALID_INPUT", "Vocabulary parameters are invalid.");
  }
  try {
    return ok(
      await new VocabularyService(
        new PrismaVocabularyRepository(getPrismaClient()),
      ).create(userId, input.data),
      201,
    );
  } catch (error) {
    const domainResponse = toDomainErrorResponse(error);
    if (domainResponse) return domainResponse;
    reportServerError("vocabulary.create_failed", "Unable to save vocabulary.", error, { userId });
    return fail("VOCABULARY_SAVE_FAILED", "Unable to save vocabulary.", 503);
  }
}
