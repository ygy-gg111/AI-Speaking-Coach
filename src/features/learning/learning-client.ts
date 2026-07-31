import { requestApi } from "@/lib/api-client";
import type { PracticeRecord } from "@/features/learning/types";

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

export async function getPracticeHistory(limit = 30) {
  const records = await requestApi<PracticeRecord[]>(
    `/api/v1/conversations?limit=${limit}`,
  );
  return records.map((record) => ({
    ...record,
    completedAt: new Date(record.completedAt).toISOString(),
  }));
}

export async function getCalendarMonth(
  year: number,
  month: number,
  timezoneOffset: number,
) {
  const search = new URLSearchParams({
    year: String(year),
    month: String(month),
    timezoneOffset: String(timezoneOffset),
  });
  const result = await requestApi<{ records: PracticeRecord[] }>(
    `/api/v1/calendar?${search.toString()}`,
  );
  return { records: normalizeRecords(result.records) };
}

export async function getCalendarDate(
  date: string,
  timezoneOffset: number,
) {
  const search = new URLSearchParams({
    timezoneOffset: String(timezoneOffset),
  });
  const result = await requestApi<{
    date: string;
    records: PracticeRecord[];
  }>(`/api/v1/calendar/${encodeURIComponent(date)}?${search.toString()}`);
  return {
    date: result.date,
    records: normalizeRecords(result.records),
  };
}

function normalizeRecords(records: PracticeRecord[]) {
  return records.map((record) => ({
    ...record,
    completedAt: new Date(record.completedAt).toISOString(),
  }));
}
