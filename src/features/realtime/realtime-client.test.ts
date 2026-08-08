import { describe, expect, it, vi } from "vitest";

import {
  assertRealtimeAvailable,
  createMicrophoneConstraints,
  exchangeRealtimeOffer,
  RealtimeClientError,
  updateRealtimeSessionStatus,
} from "./realtime-client";

describe("realtime client", () => {
  it("builds default and device-specific microphone constraints", () => {
    expect(createMicrophoneConstraints()).toEqual({
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    });
    expect(createMicrophoneConstraints("microphone-1")).toEqual({
      deviceId: { exact: "microphone-1" },
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    });
  });

  it("accepts a configured realtime service", async () => {
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify({ success: true, data: { configured: true } }),
        { status: 200 },
      ),
    );

    await expect(assertRealtimeAvailable(fetcher)).resolves.toBeUndefined();
  });

  it("reports an unavailable realtime service consistently", async () => {
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify({ success: true, data: { configured: false } }),
        { status: 200 },
      ),
    );

    await expect(assertRealtimeAvailable(fetcher)).rejects.toMatchObject({
      code: "not-configured",
    });
  });

  it("exchanges an SDP offer and returns the session metadata", async () => {
    const fetcher = vi.fn(async () =>
      new Response("answer-sdp", {
        status: 200,
        headers: { "X-Realtime-Session-Id": "session-1" },
      }),
    );

    await expect(
      exchangeRealtimeOffer("conversation/1", "offer-sdp", fetcher),
    ).resolves.toEqual({
      answerSdp: "answer-sdp",
      sessionId: "session-1",
    });
    expect(fetcher).toHaveBeenCalledWith(
      "/api/v1/realtime/session?conversationId=conversation%2F1",
      expect.objectContaining({ method: "POST", body: "offer-sdp" }),
    );
  });

  it("preserves API errors while classifying connection failures", async () => {
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify({ error: { code: "UPSTREAM_ERROR", message: "Try later" } }),
        { status: 502 },
      ),
    );

    await expect(
      exchangeRealtimeOffer("conversation-1", "offer", fetcher),
    ).rejects.toEqual(
      expect.objectContaining<Partial<RealtimeClientError>>({
        code: "connection-failed",
        message: "Try later",
      }),
    );
  });

  it("updates the persisted session status with a keepalive request", async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }));

    await updateRealtimeSessionStatus("session/1", "COMPLETED", fetcher);

    expect(fetcher).toHaveBeenCalledWith(
      "/api/v1/realtime/session/session%2F1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "COMPLETED" }),
        keepalive: true,
      }),
    );
  });
});
