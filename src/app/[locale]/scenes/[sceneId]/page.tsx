import { notFound } from "next/navigation";

import { SceneDetail } from "@/features/scenes/components/scene-detail";
import { findScene, mockScenes } from "@/features/scenes/mock-scenes";

type SceneDetailPageProps = {
  params: Promise<{ sceneId: string }>;
};

export function generateStaticParams() {
  return mockScenes.map((scene) => ({ sceneId: scene.id }));
}

export default async function SceneDetailPage({
  params,
}: SceneDetailPageProps) {
  const { sceneId } = await params;
  const scene = findScene(sceneId);

  if (!scene) {
    notFound();
  }

  return <SceneDetail scene={scene} />;
}
