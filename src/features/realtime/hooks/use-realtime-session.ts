"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useRealtimeStore } from "@/stores/realtime-store";

import { getRealtimeEventUpdate, parseRealtimeEvent } from "../events";
import type {
  RealtimeConnectionState,
  RealtimeSessionErrorCode,
} from "../types";

type RealtimeSessionOptions = {
  conversationId: string;
  sceneName: string;
  learnerLevel: string;
};

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

class RealtimeClientError extends Error {
  constructor(
    readonly code: RealtimeSessionErrorCode,
    message: string,
  ) {
    super(message);
  }
}

const MAX_RECONNECT_ATTEMPTS = 2;

function transitionTo(nextState: RealtimeConnectionState) {
  const store = useRealtimeStore.getState();
  if (store.state !== nextState) {
    store.transitionTo(nextState);
  }
}

export function useRealtimeSession(options: RealtimeSessionOptions) {
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] =
    useState<RealtimeSessionErrorCode | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const mediaRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const connectRef = useRef<(isReconnect?: boolean) => Promise<void>>(
    async () => undefined,
  );
  const manualCloseRef = useRef(false);
  const transcriptTextRef = useRef(new Map<string, string>());
  const sessionIdRef = useRef<string | null>(null);

  const finishRealtimeSession = useCallback(
    async (status: "COMPLETED" | "FAILED") => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) {
        return;
      }
      sessionIdRef.current = null;
      await fetch(
        `/api/v1/realtime/session/${encodeURIComponent(sessionId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
          keepalive: true,
        },
      ).catch(() => undefined);
    },
    [],
  );

  const cleanup = useCallback((stopMedia = true) => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    channelRef.current?.close();
    channelRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    if (audioRef.current) {
      audioRef.current.srcObject = null;
      audioRef.current.remove();
      audioRef.current = null;
    }
    if (stopMedia) {
      mediaRef.current?.getTracks().forEach((track) => track.stop());
      mediaRef.current = null;
    }
  }, []);

  const handleServerEvent = useCallback((raw: string) => {
    const event = parseRealtimeEvent(raw);
    if (!event) {
      return;
    }

    const update = getRealtimeEventUpdate(event);
    if (update.kind === "session-ready") {
      const current = useRealtimeStore.getState().state;
      if (current === "connecting" || current === "reconnecting") {
        transitionTo("connected");
        transitionTo("listening");
      }
      return;
    }
    if (update.kind === "speech-started") {
      transitionTo("user-speaking");
      return;
    }
    if (update.kind === "speech-stopped") {
      transitionTo("ai-thinking");
      return;
    }
    if (update.kind === "response-started") {
      transitionTo("ai-thinking");
      return;
    }
    if (update.kind === "response-finished") {
      transitionTo("listening");
      return;
    }
    if (update.kind === "error") {
      setError(update.message);
      setErrorCode("connection-failed");
      transitionTo("error");
      return;
    }
    if (update.kind === "transcript") {
      const previous = transcriptTextRef.current.get(update.item.id) ?? "";
      const text = update.item.final
        ? update.item.text
        : `${previous}${update.item.text}`;
      transcriptTextRef.current.set(update.item.id, text);
      useRealtimeStore.getState().upsertTranscript({
        ...update.item,
        text,
      });
      if (update.item.role === "assistant") {
        transitionTo("ai-speaking");
      }
    }
  }, []);

  const connectInternal = useCallback(
    async (isReconnect = false) => {
      cleanup();
      manualCloseRef.current = false;
      setError(null);
      setErrorCode(null);

      try {
        if (!isReconnect) {
          const current = useRealtimeStore.getState().state;
          if (current === "error" || current === "ended") {
            useRealtimeStore.getState().reset();
          }
          transitionTo("requesting-permission");

          const availabilityResponse = await fetch(
            "/api/v1/realtime/session",
            {
              method: "GET",
              cache: "no-store",
            },
          );
          const availability =
            (await availabilityResponse.json().catch(() => null)) as
              | RealtimeAvailabilityResponse
              | null;
          if (
            !availabilityResponse.ok ||
            !availability?.success ||
            !availability.data?.configured
          ) {
            throw new RealtimeClientError(
              "not-configured",
              "Realtime voice is not configured. Add OPENAI_API_KEY on the server.",
            );
          }
        } else {
          transitionTo("connecting");
        }

        const media = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaRef.current = media;
        setIsMuted(false);
        transitionTo("connecting");

        const peer = new RTCPeerConnection();
        peerRef.current = peer;

        const remoteAudio = new Audio();
        remoteAudio.autoplay = true;
        remoteAudio.setAttribute("aria-hidden", "true");
        audioRef.current = remoteAudio;
        peer.ontrack = (event) => {
          remoteAudio.srcObject = event.streams[0];
          void remoteAudio.play().catch(() => {
            setError("Audio playback was blocked. Tap the microphone to retry.");
            setErrorCode("playback-blocked");
          });
        };

        media.getTracks().forEach((track) => peer.addTrack(track, media));

        const channel = peer.createDataChannel("oai-events");
        channelRef.current = channel;
        channel.addEventListener("message", (message) => {
          if (typeof message.data === "string") {
            handleServerEvent(message.data);
          }
        });
        channel.addEventListener("open", () => {
          reconnectAttemptsRef.current = 0;
          transitionTo("connected");
          transitionTo("listening");
        });
        channel.addEventListener("error", () => {
          setError("The realtime event channel encountered an error.");
          setErrorCode("connection-failed");
        });

        peer.addEventListener("connectionstatechange", () => {
          if (manualCloseRef.current) {
            return;
          }
          if (peer.connectionState === "connected") {
            reconnectAttemptsRef.current = 0;
            return;
          }
          if (
            peer.connectionState !== "failed" &&
            peer.connectionState !== "disconnected"
          ) {
            return;
          }

          transitionTo("reconnecting");
          void finishRealtimeSession("FAILED");
          if (
            reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS ||
            reconnectTimerRef.current
          ) {
            if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
              setError("Unable to restore the realtime connection.");
              setErrorCode("connection-failed");
              transitionTo("error");
            }
            return;
          }

          reconnectAttemptsRef.current += 1;
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            void connectRef.current(true);
          }, 1_200 * reconnectAttemptsRef.current);
        });

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        if (!offer.sdp) {
          throw new Error("The browser did not create an SDP offer.");
        }

        const query = new URLSearchParams({
          conversationId: options.conversationId,
        });
        const response = await fetch(
          `/api/v1/realtime/session?${query.toString()}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/sdp" },
            body: offer.sdp,
          },
        );

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | RealtimeApiError
            | null;
          throw new RealtimeClientError(
            payload?.error?.code === "REALTIME_NOT_CONFIGURED"
              ? "not-configured"
              : "connection-failed",
            payload?.error?.code === "REALTIME_NOT_CONFIGURED"
              ? "Realtime voice is not configured. Add OPENAI_API_KEY on the server."
              : (payload?.error?.message ??
                  "Unable to start the realtime voice session."),
          );
        }

        const sessionId = response.headers.get("X-Realtime-Session-Id");
        if (!sessionId) {
          throw new Error("The realtime session identifier is missing.");
        }
        sessionIdRef.current = sessionId;

        const answer = await response.text();
        await peer.setRemoteDescription({ type: "answer", sdp: answer });
      } catch (connectError) {
        void finishRealtimeSession("FAILED");
        cleanup();
        const permissionDenied =
          connectError instanceof DOMException &&
          connectError.name === "NotAllowedError";
        setErrorCode(
          connectError instanceof RealtimeClientError
            ? connectError.code
            : permissionDenied
              ? "permission-denied"
              : "connection-failed",
        );
        setError(
          permissionDenied
            ? "Microphone permission was denied."
            : connectError instanceof Error
              ? connectError.message
              : "Unable to start the realtime voice session.",
        );
        transitionTo("error");
      }
    },
    [cleanup, finishRealtimeSession, handleServerEvent, options],
  );

  useEffect(() => {
    connectRef.current = connectInternal;
  }, [connectInternal]);

  const connect = useCallback(async () => {
    reconnectAttemptsRef.current = 0;
    await connectInternal(false);
  }, [connectInternal]);

  const disconnect = useCallback(() => {
    manualCloseRef.current = true;
    void finishRealtimeSession("COMPLETED");
    cleanup();
    const state = useRealtimeStore.getState().state;
    if (state !== "idle" && state !== "ended") {
      transitionTo("ended");
    }
  }, [cleanup, finishRealtimeSession]);

  const sendEvent = useCallback((event: Record<string, unknown>) => {
    const channel = channelRef.current;
    if (!channel || channel.readyState !== "open") {
      setError("Start the realtime session before sending a message.");
      setErrorCode("connection-failed");
      return false;
    }
    channel.send(JSON.stringify(event));
    return true;
  }, []);

  const sendText = useCallback(
    (text: string) => {
      const id = `text-${crypto.randomUUID()}`;
      if (
        !sendEvent({
          event_id: id,
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text }],
          },
        })
      ) {
        return false;
      }

      useRealtimeStore.getState().upsertTranscript({
        id: `user-${id}`,
        role: "user",
        text,
        final: true,
        createdAt: new Date().toISOString(),
      });
      sendEvent({
        type: "response.create",
        response: { output_modalities: ["audio"] },
      });
      transitionTo("ai-thinking");
      return true;
    },
    [sendEvent],
  );

  const interrupt = useCallback(() => {
    sendEvent({ type: "response.cancel" });
    sendEvent({ type: "output_audio_buffer.clear" });
    transitionTo("listening");
  }, [sendEvent]);

  const toggleMicrophone = useCallback(() => {
    const tracks = mediaRef.current?.getAudioTracks() ?? [];
    if (!tracks.length) {
      void connect();
      return;
    }

    if (useRealtimeStore.getState().state === "ai-speaking") {
      interrupt();
      tracks.forEach((track) => {
        track.enabled = true;
      });
      setIsMuted(false);
      return;
    }

    const nextMuted = tracks.some((track) => track.enabled);
    tracks.forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
    transitionTo(nextMuted ? "connected" : "listening");
  }, [connect, interrupt]);

  useEffect(
    () => () => {
      manualCloseRef.current = true;
      void finishRealtimeSession("COMPLETED");
      cleanup();
    },
    [cleanup, finishRealtimeSession],
  );

  return {
    connect,
    disconnect,
    error,
    errorCode,
    interrupt,
    isMuted,
    sendText,
    toggleMicrophone,
  };
}
