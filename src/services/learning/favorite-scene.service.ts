import { DomainError } from "@/lib/domain-error";
import type { FavoriteSceneRepository } from "@/repositories/favorite-scene.repository";
import type {
  SceneRecord,
  SceneRepository,
} from "@/repositories/scene.repository";
import type { SceneApiItem } from "@/services/scenes/scene.service";

export class FavoriteSceneService {
  constructor(
    private readonly favorites: FavoriteSceneRepository,
    private readonly scenes: SceneRepository,
  ) {}

  async list(userId: string): Promise<SceneApiItem[]> {
    return (await this.favorites.list(userId)).map(toPublicScene);
  }

  async add(userId: string, sceneIdentifier: string) {
    const scene = await this.requireScene(sceneIdentifier);
    await this.favorites.add(userId, scene.id);
    return { sceneId: scene.id, favorite: true as const };
  }

  async remove(userId: string, sceneIdentifier: string) {
    const scene = await this.requireScene(sceneIdentifier);
    await this.favorites.remove(userId, scene.id);
    return { sceneId: scene.id, favorite: false as const };
  }

  private async requireScene(identifier: string) {
    const scene = await this.scenes.findActiveByIdentifier(identifier);
    if (!scene) {
      throw new DomainError("SCENE_NOT_FOUND", "Scene not found.", 404);
    }
    return scene;
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
