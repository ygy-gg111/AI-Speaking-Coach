"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saveFavoriteScene } from "@/features/learning/learning-client";
import { useLearningStore } from "@/stores/learning-store";

export function useSceneFavorite(sceneId: string) {
  const queryClient = useQueryClient();
  const favorite = useLearningStore((store) =>
    store.favoriteSceneIds.includes(sceneId),
  );
  const setFavorite = useLearningStore((store) => store.setFavorite);
  const mutation = useMutation({
    mutationFn: (nextFavorite: boolean) =>
      saveFavoriteScene(sceneId, nextFavorite),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-scenes"] });
    },
  });

  function toggle() {
    const nextFavorite = !favorite;
    setFavorite(sceneId, nextFavorite);
    mutation.mutate(nextFavorite);
  }

  return {
    favorite,
    isSyncing: mutation.isPending,
    toggle,
  };
}
