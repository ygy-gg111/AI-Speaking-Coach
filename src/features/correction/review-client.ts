import type {
  ConversationReview,
  ReviewConversationMessage,
} from "@/features/conversation/types";

type AnalyzeConversationInput = {
  conversationId: string;
  sceneName: string;
  learnerLevel: string;
  durationSeconds: number;
  messages: ReviewConversationMessage[];
};

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

const storagePrefix = "conversation-review:";

export function readStoredReview(conversationId: string) {
  if (typeof window === "undefined") {
    return null;
  }
  const value = window.sessionStorage.getItem(
    `${storagePrefix}${conversationId}`,
  );
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as ConversationReview;
  } catch {
    return null;
  }
}

export function storeReview(
  conversationId: string,
  review: ConversationReview,
) {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(
      `${storagePrefix}${conversationId}`,
      JSON.stringify(review),
    );
  }
}

export async function analyzeConversation(
  input: AnalyzeConversationInput,
): Promise<ConversationReview> {
  const response = await fetch(
    `/api/v1/conversations/${encodeURIComponent(input.conversationId)}/review`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sceneName: input.sceneName,
        learnerLevel: input.learnerLevel,
        durationSeconds: input.durationSeconds,
        messages: input.messages,
      }),
    },
  );
  const payload = (await response.json()) as ApiResponse<ConversationReview>;
  if (!response.ok || !payload.success) {
    throw new Error(
      payload.success
        ? "Unable to analyze the conversation."
        : payload.error.message,
    );
  }
  return payload.data;
}
