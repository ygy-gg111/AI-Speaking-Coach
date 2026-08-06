import { requestApi } from "@/lib/api-client";

export type ConversationMessageRecord = {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  transcript: string | null;
  sequence: number;
  createdAt: string;
};

export type ConversationRecord = {
  id: string;
  sceneId: string | null;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  startedAt: string;
  endedAt: string | null;
  scene: {
    id: string;
    slug: string;
    titleKey: string;
    descriptionKey: string;
    category: string;
    difficulty: number;
  } | null;
  messages: ConversationMessageRecord[];
};

type MessageInput = {
  clientEventId?: string;
  role: "USER" | "ASSISTANT";
  content: string;
  transcript?: string;
};

type CompleteConversationInput = {
  durationSeconds?: number;
  summary?: string;
  newExpressions?: number;
  corrections?: number;
  mastery?: number;
};

export function createConversation(sceneId: string) {
  return requestApi<ConversationRecord>("/api/v1/conversations", {
    method: "POST",
    body: JSON.stringify({ sceneId }),
  });
}

export function getConversation(conversationId: string) {
  return requestApi<ConversationRecord>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}`,
  );
}

export function saveConversationMessage(
  conversationId: string,
  input: MessageInput,
) {
  return requestApi(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function completeConversation(
  conversationId: string,
  input: CompleteConversationInput,
) {
  return requestApi<ConversationRecord>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/complete`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function isGuestConversation(conversationId: string) {
  return !/^c[a-z0-9]{20,}$/i.test(conversationId);
}
