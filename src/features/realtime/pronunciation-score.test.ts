import { describe, expect, it } from "vitest";
import { scorePronunciation } from "./pronunciation-score";

describe("scorePronunciation", () => {
  it("scores exact and missing-word transcripts", () => {
    const exact = scorePronunciation(
      "Could I have an aisle seat?",
      "Could I have an aisle seat",
      { durationMs: 2_800, pauseRatio: 0.18, energyVariation: 0.25 },
    );
    expect(exact.accuracy).toBe(100);
    expect(exact.completeness).toBe(100);
    expect(exact.score).toBeGreaterThan(85);
    const partial = scorePronunciation("Could I have an aisle seat?", "Could I have a seat");
    expect(partial.score).toBeLessThan(100);
    expect(partial.needsPractice).toContain("aisle");
  });
});
