"use client";

import { useQuery } from "@tanstack/react-query";

import { getScene } from "../scene-client";
import { SceneDetail } from "./scene-detail";
import { Empty, Spin } from "antd";

export function SceneDetailLoader({ sceneId }: { sceneId: string }) {
  const query = useQuery({
    queryKey: ["scene", sceneId],
    queryFn: () => getScene(sceneId),
    retry: false,
    staleTime: 5 * 60 * 1_000,
  });

  if (query.isPending) return <Spin fullscreen size="large" />;
  if (!query.data) return <Empty description="Scene not found" />;
  return <SceneDetail scene={query.data} />;
}
