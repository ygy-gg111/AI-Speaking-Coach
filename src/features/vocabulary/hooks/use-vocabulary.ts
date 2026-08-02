"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useLearningStore } from "@/stores/learning-store";

import { getVocabulary, updateVocabulary } from "../vocabulary-client";

export function useCloudVocabulary() {
  const replaceVocabulary = useLearningStore((store) => store.replaceVocabulary);
  const query = useQuery({
    queryKey: ["vocabulary"],
    queryFn: () => getVocabulary(),
    retry: false,
    staleTime: 60 * 1_000,
  });
  useEffect(() => {
    if (query.data) replaceVocabulary(query.data);
  }, [query.data, replaceVocabulary]);
  return query;
}

export function useVocabularyAction() {
  const queryClient = useQueryClient();
  const updateLocal = useLearningStore((store) => store.updateVocabulary);
  const mutation = useMutation({
    mutationFn: ({
      entryId,
      input,
    }: {
      entryId: string;
      input: { action: "favorite"; favorite: boolean } | { action: "review" };
    }) => updateVocabulary(entryId, input),
    onSuccess: (entry) => {
      updateLocal(entry.id, () => entry);
      void queryClient.invalidateQueries({ queryKey: ["vocabulary"] });
    },
  });
  return (
    entryId: string,
    input: { action: "favorite"; favorite: boolean } | { action: "review" },
  ) => {
    updateLocal(entryId, (entry) =>
      input.action === "favorite"
        ? { ...entry, favorite: input.favorite }
        : { ...entry, reviewCount: Math.min(3, entry.reviewCount + 1) },
    );
    mutation.mutate({ entryId, input });
  };
}
