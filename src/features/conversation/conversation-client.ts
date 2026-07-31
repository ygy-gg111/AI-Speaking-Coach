import { requestApi } from "@/lib/api-client";

type ConversationRecord = {
  id: string;
  sceneId: string | null;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
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
