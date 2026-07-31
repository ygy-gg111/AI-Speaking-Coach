import { describe, expect, it } from "vitest";

import { isGuestConversation } from "./conversation-client";

describe("conversation client", () => {
  it("recognizes Prisma cuid conversation identifiers", () => {
    expect(isGuestConversation("cm1234567890abcdefghijkl")).toBe(false);
  });

  it.each([
    "demo",
    "guest-123",
    "airport-check-in",
    "scene-airport",
    "not-an-id",
  ])("keeps legacy and guest sessions local: %s", (conversationId) => {
    expect(isGuestConversation(conversationId)).toBe(true);
  });
});
