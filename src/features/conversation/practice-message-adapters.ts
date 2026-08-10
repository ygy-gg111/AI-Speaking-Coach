import type { RealtimeTranscriptItem } from "@/features/realtime/types";

import type { ConversationMessageRecord } from "./conversation-client";
import type {
  ConversationMessage,
  ReviewConversationMessage,
} from "./types";

export function toStoredTimelineMessages(
  messages: ConversationMessageRecord[],
): ConversationMessage[] {
  return messages
    .filter((message) => message.role !== "SYSTEM")
    .map((message) => ({
      id: message.id,
      role: message.role === "USER" ? "user" : "assistant",
      text: {
        "zh-CN": message.transcript ?? message.content,
        en: message.transcript ?? message.content,
      },
      audioAvailable: message.role === "ASSISTANT",
    }));
}

export function toLiveTimelineMessages(
  transcript: RealtimeTranscriptItem[],
): ConversationMessage[] {
  return transcript.map((item) => ({
    id: item.id,
    role: item.role,
    text: { "zh-CN": item.text, en: item.text },
    audioAvailable: item.role === "assistant",
  }));
}

export function toReviewMessages(
  storedMessages: ConversationMessageRecord[],
  transcript: RealtimeTranscriptItem[],
): ReviewConversationMessage[] {
  return [
    ...storedMessages
      .filter((message) => message.role !== "SYSTEM")
      .map((message) => ({
        role: message.role === "USER" ? "user" as const : "assistant" as const,
        text: message.transcript ?? message.content,
      })),
    ...transcript
      .filter((item) => item.final && item.text.trim())
      .map((item) => ({ role: item.role, text: item.text.trim() })),
  ];
}

export function getCompletedUserTurnKey(
  transcript: RealtimeTranscriptItem[],
) {
  return transcript
    .filter((item) => item.role === "user" && item.final)
    .map((item) => `${item.id}:${item.text}`)
    .join("|");
}
