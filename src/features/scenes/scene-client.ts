import { requestApi } from "@/lib/api-client";

import type {
  LocalizedSceneText,
  Scene,
  SceneCategory,
  SceneCoverTone,
} from "./types";

export type SceneApiItem = {
  id: string;
  slug: string;
  category: string;
  coverTone: string;
  coverMark: string;
  difficulty: number;
  estimatedMinutes: number;
  lessonCount: number;
  content: unknown;
};

type SceneListFilters = {
  category?: SceneCategory;
  query?: string;
};

const categories = new Set<SceneCategory>([
  "daily",
  "travel",
  "work",
  "education",
  "social",
]);
const coverTones = new Set<SceneCoverTone>([
  "coffee",
  "airport",
  "meeting",
  "restaurant",
  "shopping",
  "metro",
  "hotel",
  "presentation",
]);

function isLocalizedText(value: unknown): value is LocalizedSceneText {
  if (!value || typeof value !== "object") {
    return false;
  }
  const text = value as Record<string, unknown>;
  return typeof text["zh-CN"] === "string" && typeof text.en === "string";
}

export function mapSceneApiItem(item: SceneApiItem): Scene {
  const content =
    item.content && typeof item.content === "object"
      ? (item.content as Record<string, unknown>)
      : {};
  const title = isLocalizedText(content.title)
    ? content.title
    : undefined;
  const subtitle = isLocalizedText(content.subtitle)
    ? content.subtitle
    : undefined;

  if (
    !title ||
    !subtitle ||
    !categories.has(item.category as SceneCategory) ||
    !coverTones.has(item.coverTone as SceneCoverTone)
  ) {
    throw new Error(`Invalid scene payload: ${item.id}`);
  }

  return {
    id: item.id,
    slug: item.slug,
    title,
    subtitle,
    category: item.category as SceneCategory,
    coverTone: item.coverTone as SceneCoverTone,
    coverMark: item.coverMark,
    difficulty: item.difficulty,
    estimatedMinutes: item.estimatedMinutes,
    lessonCount: item.lessonCount,
    favorite: false,
  };
}

export async function getScenes(filters: SceneListFilters = {}) {
  const search = new URLSearchParams();
  if (filters.category) {
    search.set("category", filters.category);
  }
  if (filters.query?.trim()) {
    search.set("q", filters.query.trim());
  }
  const suffix = search.size > 0 ? `?${search.toString()}` : "";
  const scenes = await requestApi<SceneApiItem[]>(`/api/v1/scenes${suffix}`);
  return scenes.map(mapSceneApiItem);
}

export async function getScene(identifier: string) {
  const scene = await requestApi<SceneApiItem>(
    `/api/v1/scenes/${encodeURIComponent(identifier)}`,
  );
  return mapSceneApiItem(scene);
}
