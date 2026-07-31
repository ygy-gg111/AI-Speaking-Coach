import { getRequiredUserId } from "@/features/conversation/server-route";
import { getPrismaClient } from "@/infrastructure/database/prisma";
import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";
import { PrismaFavoriteSceneRepository } from "@/repositories/favorite-scene.repository";
import { PrismaSceneRepository } from "@/repositories/scene.repository";
import { FavoriteSceneService } from "@/services/learning/favorite-scene.service";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getRequiredUserId();
  if (typeof userId !== "string") {
    return userId;
  }

  try {
    const prisma = getPrismaClient();
    const service = new FavoriteSceneService(
      new PrismaFavoriteSceneRepository(prisma),
      new PrismaSceneRepository(prisma),
    );
    return ok({ favorites: await service.list(userId) });
  } catch (error) {
    reportServerError(
      "favorite_scene.list_failed",
      "Unable to list favorite scenes.",
      error,
      { userId },
    );
    return fail(
      "FAVORITE_SCENE_SERVICE_UNAVAILABLE",
      "Favorite scenes are temporarily unavailable.",
      503,
    );
  }
}
