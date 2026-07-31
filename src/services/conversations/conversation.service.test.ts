import {
  ConversationStatus,
  MessageRole,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import type {
  ConversationRecord,
  ConversationRepository,
} from "@/repositories/prisma-conversation.repository";
import type {
  SceneRecord,
  SceneRepository,
} from "@/repositories/scene.repository";

import { ConversationService } from "./conversation.service";

const startedAt = new Date("2026-07-31T08:00:00.000Z");
const conversation: ConversationRecord = {
  id: "conversation-1",
  userId: "user-1",
  sceneId: "scene-airport",
  status: ConversationStatus.ACTIVE,
  startedAt,
  endedAt: null,
  durationSeconds: null,
  summary: null,
  createdAt: startedAt,
  updatedAt: startedAt,
  scene: {
    id: "scene-airport",
    slug: "airport-check-in",
    titleKey: "Scenes.items.scene-airport.title",
    descriptionKey: "Scenes.items.scene-airport.description",
    category: "travel",
    difficulty: 3,
  },
  messages: [],
};
const scene: SceneRecord = {
  id: "scene-airport",
  slug: "airport-check-in",
  titleKey: "Scenes.items.scene-airport.title",
  descriptionKey: "Scenes.items.scene-airport.description",
  systemPrompt: "server-only",
  category: "travel",
  coverTone: "airport",
  coverMark: "✈",
  difficulty: 3,
  estimatedMinutes: 10,
  lessonCount: 15,
  content: null,
  sortOrder: 1,
};

function createRepositories() {
  const conversations: ConversationRepository = {
    create: vi.fn(async () => conversation),
    findOwnedById: vi.fn(async () => conversation),
    appendMessage: vi.fn(async (_conversationId, _userId, input) => ({
      id: "message-1",
      conversationId: conversation.id,
      clientEventId: input.clientEventId ?? null,
      role:
        input.role === "USER" ? MessageRole.USER : MessageRole.ASSISTANT,
      content: input.content,
      transcript: input.transcript ?? null,
      sequence: 1,
      createdAt: startedAt,
    })),
    complete: vi.fn(async (_id, _userId, durationSeconds, summary) => ({
      ...conversation,
      status: ConversationStatus.COMPLETED,
      durationSeconds,
      summary: summary ?? null,
    })),
  };
  const scenes: SceneRepository = {
    list: vi.fn(async () => [scene]),
    findActiveByIdentifier: vi.fn(async () => scene),
  };
  return { conversations, scenes };
}

describe("ConversationService", () => {
  it("resolves the active scene before creating a conversation", async () => {
    const repositories = createRepositories();
    const service = new ConversationService(
      repositories.conversations,
      repositories.scenes,
    );

    await expect(
      service.create("user-1", "airport-check-in"),
    ).resolves.toMatchObject({ id: "conversation-1" });
    expect(repositories.conversations.create).toHaveBeenCalledWith(
      "user-1",
      "scene-airport",
    );
  });

  it("passes a client event id through for idempotent message storage", async () => {
    const repositories = createRepositories();
    const service = new ConversationService(
      repositories.conversations,
      repositories.scenes,
    );

    await service.addMessage("user-1", "conversation-1", {
      clientEventId: "rtc-event-1",
      role: "USER",
      content: "I'd like to check in.",
    });

    expect(repositories.conversations.appendMessage).toHaveBeenCalledWith(
      "conversation-1",
      "user-1",
      expect.objectContaining({ clientEventId: "rtc-event-1" }),
    );
  });

  it("caps completion duration at one hour", async () => {
    const repositories = createRepositories();
    const service = new ConversationService(
      repositories.conversations,
      repositories.scenes,
    );

    await service.complete("user-1", "conversation-1", {
      durationSeconds: 3_600,
      summary: "Completed airport check-in.",
    });

    expect(repositories.conversations.complete).toHaveBeenCalledWith(
      "conversation-1",
      "user-1",
      3_600,
      "Completed airport check-in.",
    );
  });

  it("treats completing an already completed conversation as idempotent", async () => {
    const repositories = createRepositories();
    repositories.conversations.findOwnedById = vi.fn(async () => ({
      ...conversation,
      status: ConversationStatus.COMPLETED,
      endedAt: new Date("2026-07-31T08:10:00.000Z"),
      durationSeconds: 600,
    }));
    const service = new ConversationService(
      repositories.conversations,
      repositories.scenes,
    );

    const result = await service.complete("user-1", "conversation-1", {
      durationSeconds: 900,
    });

    expect(result.durationSeconds).toBe(600);
    expect(repositories.conversations.complete).not.toHaveBeenCalled();
  });
});
