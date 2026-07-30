import { PracticeSession } from "@/features/conversation/components/practice-session";

type ConversationPageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { conversationId } = await params;
  return <PracticeSession conversationId={conversationId} />;
}
