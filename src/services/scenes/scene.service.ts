import type {
  SceneFilters,
  SceneRecord,
  SceneRepository,
} from "@/repositories/scene.repository";
import { DomainError } from "@/lib/domain-error";

export type SceneApiItem = Omit<SceneRecord, "systemPrompt">;

export class SceneService {
  constructor(private readonly scenes: SceneRepository) {}

  async list(filters: SceneFilters): Promise<SceneApiItem[]> {
    return (await this.scenes.list(filters)).map(toPublicScene);
  }

  async get(identifier: string): Promise<SceneApiItem> {
    const scene = await this.scenes.findActiveByIdentifier(identifier);
    if (!scene) {
      throw new DomainError("SCENE_NOT_FOUND", "Scene not found.", 404);
    }
    return toPublicScene(scene);
  }
}

function toPublicScene(scene: SceneRecord): SceneApiItem {
  return {
    id: scene.id,
    slug: scene.slug,
    titleKey: scene.titleKey,
    descriptionKey: scene.descriptionKey,
    category: scene.category,
    coverTone: scene.coverTone,
    coverMark: scene.coverMark,
    difficulty: scene.difficulty,
    estimatedMinutes: scene.estimatedMinutes,
    lessonCount: scene.lessonCount,
    content: scene.content,
    sortOrder: scene.sortOrder,
  };
}
