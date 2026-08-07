import { describe, expect, it } from "vitest";
import { consumeRateLimit } from "./rate-limit";

describe("consumeRateLimit", () => {
  it("blocks excess requests and resets after the window", () => {
    const key = `test-${Math.random()}`;
    expect(consumeRateLimit(key, 2, 1_000, 100).allowed).toBe(true);
    expect(consumeRateLimit(key, 2, 1_000, 200).allowed).toBe(true);
    expect(consumeRateLimit(key, 2, 1_000, 300).allowed).toBe(false);
    expect(consumeRateLimit(key, 2, 1_000, 1_101).allowed).toBe(true);
  });
});
