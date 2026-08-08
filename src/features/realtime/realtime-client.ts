import type { RealtimeSessionErrorCode } from "./types";

type RealtimeApiError = {
  error?: {
    code?: string;
    message?: string;
  };
};

type RealtimeAvailabilityResponse = {
  success?: boolean;
  data?: {
    configured?: boolean;
  };
};

type Fetcher = typeof fetch;

export class RealtimeClientError extends Error {
  constructor(
    readonly code: RealtimeSessionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RealtimeClientError";
  }
}

export function createMicrophoneConstraints(
  deviceId = "",
): MediaTrackConstraints {
  return {
    ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };
}

export async function assertRealtimeAvailable(fetcher: Fetcher = fetch) {
  const response = await fetcher("/api/v1/realtime/session", {
    method: "GET",
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as
    | RealtimeAvailabilityResponse
    | null;

  if (!response.ok || !payload?.success || !payload.data?.configured) {
    throw new RealtimeClientError(
      "not-configured",
      "Realtime voice is not configured. Add OPENAI_API_KEY on the server.",
    );
  }
}

export async function exchangeRealtimeOffer(
  conversationId: string,
  offerSdp: string,
  fetcher: Fetcher = fetch,
) {
  const query = new URLSearchParams({ conversationId });
  const response = await fetcher(
    `/api/v1/realtime/session?${query.toString()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/sdp" },
      body: offerSdp,
    },
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | RealtimeApiError
      | null;
    const notConfigured =
      payload?.error?.code === "REALTIME_NOT_CONFIGURED";
    throw new RealtimeClientError(
      notConfigured ? "not-configured" : "connection-failed",
      notConfigured
        ? "Realtime voice is not configured. Add OPENAI_API_KEY on the server."
        : (payload?.error?.message ??
            "Unable to start the realtime voice session."),
    );
  }

  const sessionId = response.headers.get("X-Realtime-Session-Id");
  if (!sessionId) {
    throw new RealtimeClientError(
      "connection-failed",
      "The realtime session identifier is missing.",
    );
  }

  return {
    answerSdp: await response.text(),
    sessionId,
  };
}

export async function updateRealtimeSessionStatus(
  sessionId: string,
  status: "COMPLETED" | "FAILED",
  fetcher: Fetcher = fetch,
) {
  await fetcher(
    `/api/v1/realtime/session/${encodeURIComponent(sessionId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
      keepalive: true,
    },
  );
}
