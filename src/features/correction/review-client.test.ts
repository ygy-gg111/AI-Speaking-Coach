import { afterEach, describe, expect, it, vi } from "vitest";

import { analyzeConversation } from "./review-client";

describe("review client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps guest reviews local instead of consuming the AI endpoint", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const review = await analyzeConversation({
      conversationId: "guest-local-session",
      sceneName: "airport check in",
      learnerLevel: "A2",
      durationSeconds: 60,
      messages: [{ role: "user", text: "I want go Japan." }],
    });

    expect(review.source).toBe("fallback");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
