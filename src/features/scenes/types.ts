export type SceneCategory =
  | "daily"
  | "travel"
  | "work"
  | "education"
  | "social";

export type SceneCoverTone =
  | "coffee"
  | "airport"
  | "meeting"
  | "restaurant"
  | "shopping"
  | "metro"
  | "hotel"
  | "presentation";

export type LocalizedSceneText = {
  "zh-CN": string;
  en: string;
};

export type Scene = {
  id: string;
  slug: string;
  title: LocalizedSceneText;
  subtitle: LocalizedSceneText;
  category: SceneCategory;
  coverTone: SceneCoverTone;
  coverMark: string;
  difficulty: number;
  estimatedMinutes: number;
  lessonCount: number;
  favorite: boolean;
};

export type SceneCardVariant = "recommended" | "grid" | "compact";
