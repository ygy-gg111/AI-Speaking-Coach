import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/conversation/server-route", () => ({
  getRequiredUserId: vi.fn(async () => "pronunciation-user"),
}));

const { createAttempt, findScene } = vi.hoisted(() => ({
  createAttempt: vi.fn(async () => ({
    id: "attempt-1",
    createdAt: new Date("2026-08-07T12:00:00.000Z"),
  })),
  findScene: vi.fn(
    async (): Promise<{ id: string } | null> => ({ id: "scene-coffee" }),
  ),
}));

vi.mock("@/infrastructure/database/prisma", () => ({
  getPrismaClient: () => ({
    scene: { findFirst: findScene },
    pronunciationAttempt: { create: createAttempt },
  }),
}));

vi.mock("openai", () => ({
  default: class OpenAITestDouble {
    audio = {
      transcriptions: {
        create: vi.fn(async () => ({ text: "I would like a coffee" })),
      },
    };
  },
}));

import { POST } from "./route";

function recordingRequest(overrides: Partial<Record<string, string>> = {}) {
  const form = new FormData();
  form.set("sceneId", overrides.sceneId ?? "scene-coffee");
  form.set("target", overrides.target ?? "I would like a coffee");
  form.set("durationMs", overrides.durationMs ?? "2200");
  form.set("pauseRatio", overrides.pauseRatio ?? "0.12");
  form.set("energyVariation", overrides.energyVariation ?? "0.35");
  form.set(
    "audio",
    new File(["mock-audio"], "speech.webm", { type: "audio/webm" }),
  );
  return new Request("http://localhost/api/v1/pronunciation/evaluate", {
    method: "POST",
    body: form,
  });
}

describe("POST /api/v1/pronunciation/evaluate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    findScene.mockResolvedValue({ id: "scene-coffee" });
  });

  it("returns a multidimensional score for a valid recording", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");

    const response = await POST(recordingRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      success: true,
      data: {
        transcript: "I would like a coffee",
        accuracy: 100,
        completeness: 100,
        attemptId: "attempt-1",
        savedAt: "2026-08-07T12:00:00.000Z",
      },
    });
    expect(payload.data.score).toBeGreaterThanOrEqual(95);
    expect(payload.data.fluency).toBeGreaterThan(0);
    expect(payload.data.prosody).toBeGreaterThan(0);
    expect(createAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "pronunciation-user",
          sceneId: "scene-coffee",
          score: payload.data.score,
        }),
      }),
    );
  });

  it("rejects invalid acoustic measurements before transcription", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");

    const response = await POST(recordingRequest({ pauseRatio: "1.5" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("PRONUNCIATION_INVALID_INPUT");
  });

  it("rejects an unknown practice scene", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    findScene.mockResolvedValueOnce(null);

    const response = await POST(recordingRequest());
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error.code).toBe("PRONUNCIATION_SCENE_NOT_FOUND");
  });

  it("reports missing transcription configuration", async () => {
    vi.stubEnv("OPENAI_API_KEY", undefined);

    const response = await POST(recordingRequest());
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error.code).toBe("PRONUNCIATION_NOT_CONFIGURED");
  });
});
