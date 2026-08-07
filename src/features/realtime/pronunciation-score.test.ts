import { describe, expect, it } from "vitest";
import { scorePronunciation } from "./pronunciation-score";

describe("scorePronunciation", () => {
  it("scores exact and missing-word transcripts", () => {
    expect(scorePronunciation("Could I have an aisle seat?", "Could I have an aisle seat").score).toBe(100);
    const partial = scorePronunciation("Could I have an aisle seat?", "Could I have a seat");
    expect(partial.score).toBeLessThan(100);
    expect(partial.needsPractice).toContain("aisle");
  });
});
