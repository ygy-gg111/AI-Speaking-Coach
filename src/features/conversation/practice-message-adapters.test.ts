import { describe, expect, it } from "vitest";

import type { RealtimeTranscriptItem } from "@/features/realtime/types";

import type { ConversationMessageRecord } from "./conversation-client";
import {
  getCompletedUserTurnKey,
  toLiveTimelineMessages,
  toReviewMessages,
  toStoredTimelineMessages,
} from "./practice-message-adapters";

const storedMessages: ConversationMessageRecord[] = [
  {
    id: "system-1",
    role: "SYSTEM",
    content: "System prompt",
    transcript: null,
    sequence: 0,
    createdAt: "2026-08-08T00:00:00.000Z",
  },
  {
    id: "user-1",
    role: "USER",
    content: "Raw content",
    transcript: "Spoken content",
    sequence: 1,
    createdAt: "2026-08-08T00:00:01.000Z",
  },
  {
    id: "assistant-1",
    role: "ASSISTANT",
    content: "Welcome!",
    transcript: null,
    sequence: 2,
    createdAt: "2026-08-08T00:00:02.000Z",
  },
];

const transcript: RealtimeTranscriptItem[] = [
  { id: "live-user", role: "user", text: "  Hello  ", final: true },
  {
    id: "live-assistant",
    role: "assistant",
    text: "Hi there",
    final: false,
  },
];

describe("practice message adapters", () => {
  it("maps stored messages while omitting system prompts", () => {
    expect(toStoredTimelineMessages(storedMessages)).toEqual([
      expect.objectContaining({
        id: "user-1",
        role: "user",
        text: { "zh-CN": "Spoken content", en: "Spoken content" },
        audioAvailable: false,
      }),
      expect.objectContaining({
        id: "assistant-1",
        role: "assistant",
        audioAvailable: true,
      }),
    ]);
  });

  it("maps live transcript items for the timeline", () => {
    expect(toLiveTimelineMessages(transcript)).toEqual([
      expect.objectContaining({ id: "live-user", role: "user" }),
      expect.objectContaining({
        id: "live-assistant",
        role: "assistant",
        audioAvailable: true,
      }),
    ]);
  });

  it("builds review input from persisted and final live messages", () => {
    expect(toReviewMessages(storedMessages, transcript)).toEqual([
      { role: "user", text: "Spoken content" },
      { role: "assistant", text: "Welcome!" },
      { role: "user", text: "Hello" },
    ]);
  });

  it("creates a stable key only from completed user turns", () => {
    expect(getCompletedUserTurnKey(transcript)).toBe(
      "live-user:  Hello  ",
    );
  });
});
