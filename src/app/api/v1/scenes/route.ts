import { sceneListQuerySchema } from "@/features/scenes/server-contracts";
import { getPrismaClient } from "@/infrastructure/database/prisma";
import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";
import { PrismaSceneRepository } from "@/repositories/scene.repository";
import { SceneService } from "@/services/scenes/scene.service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const input = sceneListQuerySchema.safeParse({
    category: url.searchParams.get("category") ?? undefined,
    difficulty: url.searchParams.get("difficulty") ?? undefined,
    query: url.searchParams.get("q") ?? undefined,
  });
  if (!input.success) {
    return fail("SCENE_FILTER_INVALID", "Scene filters are invalid.");
  }

  try {
    const service = new SceneService(
      new PrismaSceneRepository(getPrismaClient()),
    );
    return ok(await service.list(input.data));
  } catch (error) {
    reportServerError("scene.list_failed", "Unable to list scenes.", error);
    return fail(
      "SCENE_SERVICE_UNAVAILABLE",
      "Scene service is temporarily unavailable.",
      503,
    );
  }
}
