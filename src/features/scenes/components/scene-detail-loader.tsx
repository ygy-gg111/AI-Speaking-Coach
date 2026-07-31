"use client";

import { useQuery } from "@tanstack/react-query";

import { getScene } from "../scene-client";
import type { Scene } from "../types";
import { SceneDetail } from "./scene-detail";

export function SceneDetailLoader({ fallback }: { fallback: Scene }) {
  const query = useQuery({
    queryKey: ["scene", fallback.id],
    queryFn: () => getScene(fallback.id),
    retry: false,
    staleTime: 5 * 60 * 1_000,
  });

  return <SceneDetail scene={query.data ?? fallback} />;
}
