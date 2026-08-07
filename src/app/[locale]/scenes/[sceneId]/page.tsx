import { SceneDetailLoader } from "@/features/scenes/components/scene-detail-loader";

type SceneDetailPageProps = {
  params: Promise<{ sceneId: string }>;
};

export default async function SceneDetailPage({
  params,
}: SceneDetailPageProps) {
  const { sceneId } = await params;
  return <SceneDetailLoader sceneId={sceneId} />;
}
