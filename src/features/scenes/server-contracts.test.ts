import { describe, expect, it } from "vitest";

import { sceneListQuerySchema } from "./server-contracts";

describe("scene list query", () => {
  it("coerces a valid difficulty filter", () => {
    expect(
      sceneListQuerySchema.parse({
        category: "travel",
        difficulty: "3",
        query: "airport",
      }),
    ).toEqual({
      category: "travel",
      difficulty: 3,
      query: "airport",
    });
  });

  it("rejects unknown categories and out-of-range difficulty", () => {
    expect(
      sceneListQuerySchema.safeParse({
        category: "unknown",
        difficulty: "8",
      }).success,
    ).toBe(false);
  });
});
