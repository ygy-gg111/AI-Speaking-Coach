import { describe, expect, it, vi } from "vitest";

import type { FavoriteSceneRepository } from "@/repositories/favorite-scene.repository";
import type {
  SceneRecord,
  SceneRepository,
} from "@/repositories/scene.repository";

import { FavoriteSceneService } from "./favorite-scene.service";

const scene: SceneRecord = {
  id: "scene-airport",
  slug: "airport-check-in",
  titleKey: "Scenes.items.scene-airport.title",
  descriptionKey: "Scenes.items.scene-airport.description",
  systemPrompt: "private prompt",
  category: "travel",
  coverTone: "airport",
  coverMark: "A",
  difficulty: 3,
  estimatedMinutes: 10,
  lessonCount: 15,
  content: null,
  sortOrder: 1,
};

function createService(availableScene: SceneRecord | null = scene) {
  const favorites: FavoriteSceneRepository = {
    list: vi.fn(async () => (availableScene ? [availableScene] : [])),
    add: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined),
  };
  const scenes: SceneRepository = {
    list: vi.fn(async () => (availableScene ? [availableScene] : [])),
    findActiveByIdentifier: vi.fn(async () => availableScene),
  };
  return {
    favorites,
    service: new FavoriteSceneService(favorites, scenes),
  };
}

describe("FavoriteSceneService", () => {
  it("lists public scene data without exposing prompts", async () => {
    const { service } = createService();
    const result = await service.list("user-1");

    expect(result[0]).toMatchObject({ id: scene.id, slug: scene.slug });
    expect(result[0]).not.toHaveProperty("systemPrompt");
  });

  it("resolves a scene slug before saving a favorite", async () => {
    const { favorites, service } = createService();

    await expect(
      service.add("user-1", "airport-check-in"),
    ).resolves.toEqual({ sceneId: scene.id, favorite: true });
    expect(favorites.add).toHaveBeenCalledWith("user-1", scene.id);
  });

  it("returns a stable error when the scene does not exist", async () => {
    const { service } = createService(null);

    await expect(service.remove("user-1", "missing")).rejects.toMatchObject({
      code: "SCENE_NOT_FOUND",
      status: 404,
    });
  });
});
