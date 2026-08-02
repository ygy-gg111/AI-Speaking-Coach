import { MistakeCategory, MistakeStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import type {
  MistakeRecordData,
  MistakeRepository,
} from "@/repositories/mistake.repository";

import { MistakeService } from "./mistake.service";

const storedMistake: MistakeRecordData = {
  id: "mistake-1",
  conversationId: "conversation-1",
  sceneId: "scene-airport",
  original: "I want go Japan.",
  improved: "I want to go to Japan.",
  reasonZh: "want 后接 to + 动词原形。",
  reasonEn: "Use want to plus the base verb.",
  category: MistakeCategory.GRAMMAR,
  reviewCount: 1,
  status: MistakeStatus.LEARNING,
  createdAt: new Date("2026-08-02T02:00:00.000Z"),
};

function createService(created: MistakeRecordData | null = storedMistake) {
  const repository: MistakeRepository = {
    list: vi.fn(async () => [storedMistake]),
    createForConversation: vi.fn(async () => created),
    review: vi.fn(async () =>
      created
        ? {
            ...created,
            reviewCount: 3,
            status: MistakeStatus.MASTERED,
          }
        : null,
    ),
  };
  return { repository, service: new MistakeService(repository) };
}

describe("MistakeService", () => {
  it("maps database enums and localized reasons for the client", async () => {
    const { service } = createService();
    await expect(service.list("user-1")).resolves.toEqual([
      expect.objectContaining({
        id: "mistake-1",
        category: "grammar",
        status: "learning",
        reason: {
          "zh-CN": "want 后接 to + 动词原形。",
          en: "Use want to plus the base verb.",
        },
      }),
    ]);
  });

  it("creates a mistake for an owned completed conversation", async () => {
    const { repository, service } = createService();
    await service.create("user-1", {
      conversationId: "conversation-1",
      original: storedMistake.original,
      improved: storedMistake.improved,
      reason: {
        "zh-CN": storedMistake.reasonZh,
        en: storedMistake.reasonEn,
      },
      category: "grammar",
    });
    expect(repository.createForConversation).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ category: MistakeCategory.GRAMMAR }),
    );
  });

  it("rejects conversations that are missing or not completed", async () => {
    const { service } = createService(null);
    await expect(
      service.create("user-1", {
        conversationId: "missing",
        original: "Wrong",
        improved: "Correct",
        reason: { "zh-CN": "原因", en: "Reason" },
        category: "expression",
      }),
    ).rejects.toMatchObject({
      code: "MISTAKE_CONVERSATION_NOT_FOUND",
      status: 404,
    });
  });

  it("returns the mastered state after the third review", async () => {
    const { service } = createService();
    await expect(service.review("user-1", "mistake-1")).resolves.toMatchObject({
      reviewCount: 3,
      status: "mastered",
    });
  });
});
