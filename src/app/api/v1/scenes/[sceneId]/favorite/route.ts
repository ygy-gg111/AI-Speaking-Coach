import {
  getRequiredUserId,
  toDomainErrorResponse,
} from "@/features/conversation/server-route";
import { getPrismaClient } from "@/infrastructure/database/prisma";
import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";
import { PrismaFavoriteSceneRepository } from "@/repositories/favorite-scene.repository";
import { PrismaSceneRepository } from "@/repositories/scene.repository";
import { FavoriteSceneService } from "@/services/learning/favorite-scene.service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ sceneId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  return updateFavorite(context, true);
}

export async function DELETE(_request: Request, context: RouteContext) {
  return updateFavorite(context, false);
}

async function updateFavorite(context: RouteContext, favorite: boolean) {
  const userId = await getRequiredUserId();
  if (typeof userId !== "string") {
    return userId;
  }
  const { sceneId } = await context.params;
  if (!sceneId || sceneId.length > 128) {
    return fail("SCENE_IDENTIFIER_INVALID", "Scene identifier is invalid.");
  }

  try {
    const prisma = getPrismaClient();
    const service = new FavoriteSceneService(
      new PrismaFavoriteSceneRepository(prisma),
      new PrismaSceneRepository(prisma),
    );
    return ok(
      favorite
        ? await service.add(userId, sceneId)
        : await service.remove(userId, sceneId),
    );
  } catch (error) {
    const domainResponse = toDomainErrorResponse(error);
    if (domainResponse) {
      return domainResponse;
    }
    reportServerError(
      "favorite_scene.update_failed",
      "Unable to update favorite scene.",
      error,
      { userId, sceneId, favorite },
    );
    return fail(
      "FAVORITE_SCENE_UPDATE_FAILED",
      "Unable to update the favorite scene.",
      503,
    );
  }
}
