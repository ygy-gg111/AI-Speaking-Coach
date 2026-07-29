import { describe, expect, it } from "vitest";

import { mockScenes } from "./mock-scenes";

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
});
