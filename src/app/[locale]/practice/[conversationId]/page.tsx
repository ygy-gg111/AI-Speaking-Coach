import { PracticeSession } from "@/features/conversation/components/practice-session";

type ConversationPageProps = {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{ scene?: string }>;
};

export default async function ConversationPage({
  params,
  searchParams,
}: ConversationPageProps) {
  const { conversationId } = await params;
  const { scene } = await searchParams;
  return (
    <PracticeSession
      conversationId={conversationId}
      sceneIdentifier={scene}
    />
  );
}
