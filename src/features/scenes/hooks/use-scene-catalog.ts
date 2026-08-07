"use client";

import { useQuery } from "@tanstack/react-query";

import { getScenes } from "../scene-client";

export function useSceneCatalog() {
  return useQuery({
    queryKey: ["scenes", "catalog"],
    queryFn: () => getScenes(),
    staleTime: 5 * 60 * 1_000,
  });
}
