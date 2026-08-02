import { describe, expect, it, vi } from "vitest";

import type {
  VocabularyRecordData,
  VocabularyRepository,
} from "@/repositories/vocabulary.repository";

import { VocabularyService } from "./vocabulary.service";

const record: VocabularyRecordData = {
  id: "vocabulary-1",
  conversationId: "conversation-1",
  sceneId: "scene-airport",
  phrase: "I want to go to Japan.",
  meaningZh: "使用 want to + 动词。",
  meaningEn: "Use want to plus a verb.",
  example: "I want to go to Japan.",
  favorite: false,
  reviewCount: 0,
  createdAt: new Date("2026-08-03T02:00:00.000Z"),
};

function createService(created: VocabularyRecordData | null = record) {
  const repository: VocabularyRepository = {
    list: vi.fn(async () => [record]),
    createForConversation: vi.fn(async () => created),
    setFavorite: vi.fn(async (_, __, favorite) =>
      created ? { ...created, favorite } : null,
    ),
    review: vi.fn(async () =>
      created ? { ...created, reviewCount: created.reviewCount + 1 } : null,
    ),
  };
  return { repository, service: new VocabularyService(repository) };
}

describe("VocabularyService", () => {
  it("maps database fields to a bilingual client entry", async () => {
    const { service } = createService();
    await expect(service.list("user-1")).resolves.toEqual([
      expect.objectContaining({
        phrase: record.phrase,
        meaning: { "zh-CN": record.meaningZh, en: record.meaningEn },
      }),
    ]);
  });

  it("saves expressions only for a completed owned conversation", async () => {
    const { repository, service } = createService();
    await service.create("user-1", {
      conversationId: record.conversationId,
      phrase: record.phrase,
      meaning: { "zh-CN": record.meaningZh, en: record.meaningEn },
      example: record.example,
    });
    expect(repository.createForConversation).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ phrase: record.phrase }),
    );
  });

  it("updates favorite and review state", async () => {
    const { service } = createService();
    await expect(
      service.update("user-1", record.id, {
        action: "favorite",
        favorite: true,
      }),
    ).resolves.toMatchObject({ favorite: true });
    await expect(
      service.update("user-1", record.id, { action: "review" }),
    ).resolves.toMatchObject({ reviewCount: 1 });
  });

  it("returns a stable error for inaccessible entries", async () => {
    const { service } = createService(null);
    await expect(
      service.update("user-1", "missing", { action: "review" }),
    ).rejects.toMatchObject({ code: "VOCABULARY_NOT_FOUND", status: 404 });
  });
});
