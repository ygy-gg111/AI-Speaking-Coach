import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn<() => Promise<string | null>>(),
  findConversation: vi.fn(),
  findProfile: vi.fn(),
}));

vi.mock("@/features/auth/session", () => ({
  getSessionUserId: mocks.getSessionUserId,
}));

vi.mock("@/infrastructure/database/prisma", () => ({
  getPrismaClient: () => ({
    conversation: { findFirst: mocks.findConversation },
    userProfile: { findUnique: mocks.findProfile },
  }),
}));

import { POST } from "./route";

function createRequest() {
  return new Request("http://localhost/api/v1/conversations/test/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sceneName: "spoofed scene",
      learnerLevel: "C2",
      durationSeconds: 60,
      messages: [{ role: "user", text: "I want go Japan." }],
    }),
  });
}

const context = { params: Promise.resolve({ conversationId: "conversation-1" }) };

describe("POST /api/v1/conversations/:conversationId/review", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("requires authentication before generating a review", async () => {
    mocks.getSessionUserId.mockResolvedValue(null);

    const response = await POST(createRequest(), context);

    expect(response.status).toBe(401);
    expect(mocks.findConversation).not.toHaveBeenCalled();
  });

  it("rejects a conversation that is not owned by the user", async () => {
    mocks.getSessionUserId.mockResolvedValue("user-1");
    mocks.findConversation.mockResolvedValue(null);

    const response = await POST(createRequest(), context);

    expect(response.status).toBe(404);
  });

  it("returns a local fallback for an owned conversation when AI is unavailable", async () => {
    vi.stubEnv("OPENAI_API_KEY", undefined);
    mocks.getSessionUserId.mockResolvedValue("user-1");
    mocks.findConversation.mockResolvedValue({
      id: "conversation-1",
      userId: "user-1",
      status: "ACTIVE",
      scene: { slug: "airport-check-in" },
      messages: [],
    });
    mocks.findProfile.mockResolvedValue({ level: "B1" });

    const response = await POST(createRequest(), context);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      success: true,
      data: { source: "fallback" },
    });
    expect(mocks.findProfile).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: { level: true },
    });
  });
});
