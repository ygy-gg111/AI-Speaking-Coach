import { describe, expect, it } from "vitest";

import type {
  SceneRecord,
  SceneRepository,
} from "@/repositories/scene.repository";

import { SceneService } from "./scene.service";

const scene: SceneRecord = {
  id: "scene-airport",
  slug: "airport-check-in",
  titleKey: "Scenes.items.scene-airport.title",
  descriptionKey: "Scenes.items.scene-airport.description",
  systemPrompt: "secret server instructions",
  category: "travel",
  coverTone: "airport",
  coverMark: "✈",
  difficulty: 3,
  estimatedMinutes: 10,
  lessonCount: 15,
  content: null,
  sortOrder: 1,
};

describe("SceneService", () => {
  it("never exposes the server system prompt", async () => {
    const repository: SceneRepository = {
      list: async () => [scene],
      findActiveByIdentifier: async () => scene,
    };

    const result = await new SceneService(repository).get("scene-airport");

    expect(result).toMatchObject({
      id: "scene-airport",
      slug: "airport-check-in",
    });
    expect(result).not.toHaveProperty("systemPrompt");
  });

  it("returns a stable not-found domain error", async () => {
    const repository: SceneRepository = {
      list: async () => [],
      findActiveByIdentifier: async () => null,
    };

    await expect(
      new SceneService(repository).get("missing"),
    ).rejects.toMatchObject({
      code: "SCENE_NOT_FOUND",
      status: 404,
    });
  });
});
