"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createSeedLearningRecords } from "@/features/learning/learning-data";
import type { PracticeRecord } from "@/features/learning/types";
import { createSeedMistakes } from "@/features/mistakes/mistake-data";
import type { MistakeRecord } from "@/features/mistakes/types";
import { mockScenes } from "@/features/scenes/mock-scenes";

type LearningStore = {
  favoriteSceneIds: string[];
  records: PracticeRecord[];
  mistakes: MistakeRecord[];
  toggleFavorite: (sceneId: string) => void;
  setFavorite: (sceneId: string, favorite: boolean) => void;
  replaceFavoriteSceneIds: (sceneIds: string[]) => void;
  replacePracticeRecords: (records: PracticeRecord[]) => void;
  addPracticeRecord: (record: PracticeRecord) => void;
  addMistake: (mistake: MistakeRecord) => void;
  reviewMistake: (mistakeId: string) => void;
};

export const useLearningStore = create<LearningStore>()(
  persist(
    (set) => ({
      favoriteSceneIds: mockScenes
        .filter((scene) => scene.favorite)
        .map((scene) => scene.id),
      records: createSeedLearningRecords(),
      mistakes: createSeedMistakes(),
      toggleFavorite: (sceneId) =>
        set((current) => ({
          favoriteSceneIds: current.favoriteSceneIds.includes(sceneId)
            ? current.favoriteSceneIds.filter((id) => id !== sceneId)
            : [...current.favoriteSceneIds, sceneId],
        })),
      setFavorite: (sceneId, favorite) =>
        set((current) => ({
          favoriteSceneIds: favorite
            ? Array.from(new Set([...current.favoriteSceneIds, sceneId]))
            : current.favoriteSceneIds.filter((id) => id !== sceneId),
        })),
      replaceFavoriteSceneIds: (sceneIds) =>
        set({ favoriteSceneIds: Array.from(new Set(sceneIds)) }),
      replacePracticeRecords: (records) => set({ records }),
      addPracticeRecord: (record) =>
        set((current) => ({
          records: [
            record,
            ...current.records.filter(
              (item) => item.conversationId !== record.conversationId,
            ),
          ],
        })),
      addMistake: (mistake) =>
        set((current) => ({
          mistakes: [
            mistake,
            ...current.mistakes.filter((item) => item.id !== mistake.id),
          ],
        })),
      reviewMistake: (mistakeId) =>
        set((current) => ({
          mistakes: current.mistakes.map((mistake) => {
            if (mistake.id !== mistakeId) {
              return mistake;
            }
            const reviewCount = mistake.reviewCount + 1;
            return {
              ...mistake,
              reviewCount,
              status: reviewCount >= 3 ? "mastered" : "learning",
            };
          }),
        })),
    }),
    {
      name: "ai-speaking-learning",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
