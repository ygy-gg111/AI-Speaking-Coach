import { describe, expect, it, vi } from "vitest";

import type { RealtimeSessionRepository } from "@/repositories/realtime-session.repository";

import { RealtimeSessionService } from "./realtime-session.service";

const learnerContext = {
  sceneName: "airport check in",
  learnerLevel: "A2",
  voice: "marin",
  speed: 1,
  correctionFrequency: "balanced",
  learningGoal: "travel",
  showChinese: true,
};

function createRepository(): RealtimeSessionRepository {
  return {
    getLearnerContext: vi.fn(async () => learnerContext),
    create: vi.fn(async () => ({ id: "realtime-session-1" })),
    markConnected: vi.fn(async () => true),
    finish: vi.fn(async () => true),
  };
}

describe("RealtimeSessionService", () => {
  it("loads trusted learner context from an owned active conversation", async () => {
    const repository = createRepository();
    const service = new RealtimeSessionService(repository);

    await expect(
      service.getContext("user-1", "conversation-1"),
    ).resolves.toEqual(learnerContext);
    expect(repository.getLearnerContext).toHaveBeenCalledWith(
      "conversation-1",
      "user-1",
    );
  });

  it("rejects a missing or inactive conversation", async () => {
    const repository = createRepository();
    repository.getLearnerContext = vi.fn(async () => null);
    const service = new RealtimeSessionService(repository);

    await expect(
      service.getContext("user-1", "conversation-1"),
    ).rejects.toMatchObject({
      code: "CONVERSATION_NOT_ACTIVE",
      status: 409,
    });
  });

  it("persists creation and terminal session states", async () => {
    const repository = createRepository();
    const service = new RealtimeSessionService(repository);
    const configuration = { type: "realtime", model: "gpt-realtime" };

    await expect(
      service.create("user-1", "conversation-1", configuration),
    ).resolves.toEqual({ id: "realtime-session-1" });
    await expect(
      service.finish("user-1", "realtime-session-1", "COMPLETED"),
    ).resolves.toEqual({
      id: "realtime-session-1",
      status: "COMPLETED",
    });
    expect(repository.create).toHaveBeenCalledWith(
      "conversation-1",
      "user-1",
      configuration,
    );
    expect(repository.finish).toHaveBeenCalledWith(
      "realtime-session-1",
      "user-1",
      "COMPLETED",
    );
  });

  it("does not allow another user to finish a session", async () => {
    const repository = createRepository();
    repository.finish = vi.fn(async () => false);
    const service = new RealtimeSessionService(repository);

    await expect(
      service.finish("user-2", "realtime-session-1", "FAILED"),
    ).rejects.toMatchObject({
      code: "REALTIME_SESSION_NOT_FOUND",
      status: 404,
    });
  });
});
