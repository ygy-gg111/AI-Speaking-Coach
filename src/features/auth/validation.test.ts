import { describe, expect, it } from "vitest";

import { preferencesUpdateSchema } from "./validation";

describe("preference validation", () => {
  const preferences = {
    voice: "marin",
    speed: 1,
    correctionFrequency: "balanced",
    learningGoal: "daily",
    showChinese: true,
    autoPlay: true,
    saveAudio: false,
    saveConversation: true,
  };

  it("accepts supported realtime preferences", () => {
    expect(preferencesUpdateSchema.safeParse(preferences).success).toBe(true);
  });

  it("rejects unsupported voices and speech speeds", () => {
    expect(
      preferencesUpdateSchema.safeParse({
        ...preferences,
        voice: "unknown",
        speed: 2,
      }).success,
    ).toBe(false);
  });
});
