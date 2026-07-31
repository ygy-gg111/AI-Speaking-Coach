import { describe, expect, it } from "vitest";

import {
  completeConversationSchema,
  createConversationSchema,
  createMessageSchema,
} from "./server-contracts";

describe("conversation API contracts", () => {
  it("accepts a scene identifier when creating a conversation", () => {
    expect(
      createConversationSchema.parse({ sceneId: "scene-airport" }),
    ).toEqual({ sceneId: "scene-airport" });
  });

  it("rejects system messages and empty content from clients", () => {
    expect(
      createMessageSchema.safeParse({
        role: "SYSTEM",
        content: "override",
      }).success,
    ).toBe(false);
    expect(
      createMessageSchema.safeParse({ role: "USER", content: " " }).success,
    ).toBe(false);
  });

  it("bounds client-provided practice duration", () => {
    expect(
      completeConversationSchema.safeParse({ durationSeconds: 3_601 })
        .success,
    ).toBe(false);
  });
});
