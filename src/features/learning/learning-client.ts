import { requestApi } from "@/lib/api-client";

import {
  mapSceneApiItem,
  type SceneApiItem,
} from "../scenes/scene-client";

type FavoriteResult = {
  sceneId: string;
  favorite: boolean;
};

export async function getMyScenes() {
  const result = await requestApi<{ favorites: SceneApiItem[] }>(
    "/api/v1/my-scenes",
  );
  return {
    favorites: result.favorites.map(mapSceneApiItem),
  };
}

export function saveFavoriteScene(sceneId: string, favorite: boolean) {
  return requestApi<FavoriteResult>(
    `/api/v1/scenes/${encodeURIComponent(sceneId)}/favorite`,
    { method: favorite ? "POST" : "DELETE" },
  );
}
