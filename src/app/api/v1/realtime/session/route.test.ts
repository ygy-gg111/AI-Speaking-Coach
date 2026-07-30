import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("GET /api/v1/realtime/session", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports when realtime voice is not configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", undefined);

    const response = GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(payload).toMatchObject({
      success: true,
      data: {
        configured: false,
        model: "gpt-realtime-2.1",
        voice: "marin",
      },
    });
  });

  it("reports readiness without exposing the API key", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-secret-that-must-not-leak");
    vi.stubEnv("OPENAI_REALTIME_MODEL", "gpt-realtime-2.1");
    vi.stubEnv("OPENAI_REALTIME_VOICE", "marin");

    const response = GET();
    const body = await response.text();

    expect(JSON.parse(body)).toMatchObject({
      success: true,
      data: {
        configured: true,
        model: "gpt-realtime-2.1",
        voice: "marin",
      },
    });
    expect(body).not.toContain("test-secret-that-must-not-leak");
  });
});
