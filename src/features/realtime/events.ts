import type { RealtimeTranscriptItem } from "./types";

type RealtimeEvent = Record<string, unknown> & {
  type: string;
};

export type RealtimeEventUpdate =
  | { kind: "session-ready" }
  | { kind: "speech-started" }
  | { kind: "speech-stopped" }
  | { kind: "response-started" }
  | { kind: "response-finished" }
  | { kind: "transcript"; item: RealtimeTranscriptItem }
  | { kind: "error"; message: string }
  | { kind: "ignored" };

function stringField(event: RealtimeEvent, key: string) {
  return typeof event[key] === "string" ? event[key] : undefined;
}

export function parseRealtimeEvent(raw: string): RealtimeEvent | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (
      value &&
      typeof value === "object" &&
      "type" in value &&
      typeof value.type === "string"
    ) {
      return value as RealtimeEvent;
    }
  } catch {
    return null;
  }
  return null;
}

export function getRealtimeEventUpdate(
  event: RealtimeEvent,
): RealtimeEventUpdate {
  if (event.type === "session.created" || event.type === "session.updated") {
    return { kind: "session-ready" };
  }
  if (event.type === "input_audio_buffer.speech_started") {
    return { kind: "speech-started" };
  }
  if (event.type === "input_audio_buffer.speech_stopped") {
    return { kind: "speech-stopped" };
  }
  if (event.type === "response.created") {
    return { kind: "response-started" };
  }
  if (event.type === "response.done") {
    return { kind: "response-finished" };
  }
  if (event.type === "error") {
    const error =
      event.error && typeof event.error === "object"
        ? (event.error as Record<string, unknown>)
        : undefined;
    return {
      kind: "error",
      message:
        typeof error?.message === "string"
          ? error.message
          : "Realtime session error.",
    };
  }

  const isUserTranscript = event.type.startsWith(
    "conversation.item.input_audio_transcription.",
  );
  const isAssistantTranscript =
    event.type.startsWith("response.output_audio_transcript.") ||
    event.type.startsWith("response.output_text.");

  if (isUserTranscript || isAssistantTranscript) {
    const text =
      stringField(event, "delta") ??
      stringField(event, "transcript") ??
      stringField(event, "text");
    const id =
      stringField(event, "item_id") ??
      stringField(event, "response_id") ??
      stringField(event, "event_id");

    if (text && id) {
      return {
        kind: "transcript",
        item: {
          id: `${isUserTranscript ? "user" : "assistant"}-${id}`,
          role: isUserTranscript ? "user" : "assistant",
          text,
          final:
            event.type.endsWith(".completed") ||
            event.type.endsWith(".done"),
          createdAt: new Date().toISOString(),
        },
      };
    }
  }

  return { kind: "ignored" };
}
