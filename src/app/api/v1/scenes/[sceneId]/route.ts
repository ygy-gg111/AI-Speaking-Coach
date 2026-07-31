import { getPrismaClient } from "@/infrastructure/database/prisma";
import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";
import { DomainError } from "@/lib/domain-error";
import { PrismaSceneRepository } from "@/repositories/scene.repository";
import { SceneService } from "@/services/scenes/scene.service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ sceneId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { sceneId } = await context.params;
  if (!sceneId || sceneId.length > 128) {
    return fail("SCENE_IDENTIFIER_INVALID", "Scene identifier is invalid.");
  }

  try {
    const service = new SceneService(
      new PrismaSceneRepository(getPrismaClient()),
    );
    return ok(await service.get(sceneId));
  } catch (error) {
    if (error instanceof DomainError) {
      return fail(error.code, error.message, error.status);
    }
    reportServerError("scene.load_failed", "Unable to load scene.", error, {
      sceneId,
    });
    return fail(
      "SCENE_SERVICE_UNAVAILABLE",
      "Scene service is temporarily unavailable.",
      503,
    );
  }
}
