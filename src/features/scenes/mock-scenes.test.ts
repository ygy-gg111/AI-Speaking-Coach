import { describe, expect, it } from "vitest";

import { getSceneDetail } from "./scene-detail-data";
import { findScene, mockScenes } from "./mock-scenes";

describe("scene catalog", () => {
  it("uses unique ids and slugs", () => {
    const ids = mockScenes.map((scene) => scene.id);
    const slugs = mockScenes.map((scene) => scene.slug);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("contains complete bilingual and practice metadata", () => {
    for (const scene of mockScenes) {
      expect(scene.title["zh-CN"]).not.toBe("");
      expect(scene.title.en).not.toBe("");
      expect(scene.subtitle["zh-CN"]).not.toBe("");
      expect(scene.subtitle.en).not.toBe("");
      expect(scene.difficulty).toBeGreaterThanOrEqual(1);
      expect(scene.difficulty).toBeLessThanOrEqual(5);
      expect(scene.estimatedMinutes).toBeGreaterThan(0);
      expect(scene.lessonCount).toBeGreaterThan(0);
    }
  });

  it("resolves scenes by id and slug", () => {
    const scene = mockScenes[0];

    expect(findScene(scene.id)).toBe(scene);
    expect(findScene(scene.slug)).toBe(scene);
    expect(findScene("missing-scene")).toBeUndefined();
  });

  it("provides bilingual goals and useful phrases for every scene", () => {
    for (const scene of mockScenes) {
      const detail = getSceneDetail(scene.id);

      expect(detail.context["zh-CN"]).not.toBe("");
      expect(detail.context.en).not.toBe("");
      expect(detail.partner["zh-CN"]).not.toBe("");
      expect(detail.partner.en).not.toBe("");
      expect(detail.goals).toHaveLength(3);
      expect(detail.phrases).toHaveLength(3);
      detail.phrases.forEach((phrase) => {
        expect(phrase.expression).not.toBe("");
        expect(phrase.meaning["zh-CN"]).not.toBe("");
        expect(phrase.meaning.en).not.toBe("");
      });
    }
  });
});
