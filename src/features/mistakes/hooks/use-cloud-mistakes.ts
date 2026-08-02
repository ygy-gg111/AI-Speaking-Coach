"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { getMistakes, markMistakeReviewed } from "../mistake-client";
import { useLearningStore } from "@/stores/learning-store";

export function useCloudMistakes() {
  const replaceMistakes = useLearningStore((store) => store.replaceMistakes);
  const query = useQuery({
    queryKey: ["mistakes"],
    queryFn: () => getMistakes(),
    retry: false,
    staleTime: 60 * 1_000,
  });
  useEffect(() => {
    if (query.data) replaceMistakes(query.data);
  }, [query.data, replaceMistakes]);
  return query;
}

export function useReviewMistake() {
  const queryClient = useQueryClient();
  const reviewLocalMistake = useLearningStore((store) => store.reviewMistake);
  const replaceMistake = useLearningStore((store) => store.replaceMistake);
  const mutation = useMutation({
    mutationFn: markMistakeReviewed,
    onSuccess: (mistake) => {
      replaceMistake(mistake);
      void queryClient.invalidateQueries({ queryKey: ["mistakes"] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
  return (mistakeId: string) => {
    reviewLocalMistake(mistakeId);
    mutation.mutate(mistakeId);
  };
}
