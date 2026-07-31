import { describe, expect, it } from "vitest";

import { mapSceneApiItem } from "./scene-client";

describe("scene client", () => {
  it("maps localized API content into the frontend scene model", () => {
    const scene = mapSceneApiItem({
      id: "scene-coffee",
      slug: "coffee-order",
      category: "daily",
      coverTone: "coffee",
      coverMark: "C",
      difficulty: 2,
      estimatedMinutes: 8,
      lessonCount: 10,
      content: {
        title: { "zh-CN": "咖啡店点餐", en: "Ordering coffee" },
        subtitle: { "zh-CN": "自然完成点单", en: "Order naturally" },
      },
    });

    expect(scene.title.en).toBe("Ordering coffee");
    expect(scene.subtitle["zh-CN"]).toBe("自然完成点单");
    expect(scene.category).toBe("daily");
  });

  it("falls back to bundled localization for known scenes", () => {
    const scene = mapSceneApiItem({
      id: "scene-airport",
      slug: "airport-check-in",
      category: "travel",
      coverTone: "airport",
      coverMark: "A",
      difficulty: 3,
      estimatedMinutes: 10,
      lessonCount: 15,
      content: null,
    });

    expect(scene.title.en).toBe("Airport check-in");
  });

  it("rejects unsupported backend presentation values", () => {
    expect(() =>
      mapSceneApiItem({
        id: "scene-unknown",
        slug: "unknown",
        category: "unknown",
        coverTone: "unknown",
        coverMark: "?",
        difficulty: 1,
        estimatedMinutes: 5,
        lessonCount: 1,
        content: {},
      }),
    ).toThrow("Invalid scene payload");
  });
});
