import { describe, expect, it } from "vitest";

import { getRealtimeEventUpdate, parseRealtimeEvent } from "./events";

describe("Realtime event parsing", () => {
  it("extracts an assistant transcript delta", () => {
    const event = parseRealtimeEvent(
      JSON.stringify({
        type: "response.output_audio_transcript.delta",
        item_id: "item-1",
        delta: "Hello",
      }),
    );

    expect(event && getRealtimeEventUpdate(event)).toMatchObject({
      kind: "transcript",
      item: {
        id: "assistant-item-1",
        role: "assistant",
        text: "Hello",
        final: false,
      },
    });
  });

  it("extracts a completed user transcript", () => {
    const event = parseRealtimeEvent(
      JSON.stringify({
        type: "conversation.item.input_audio_transcription.completed",
        item_id: "item-2",
        transcript: "I need a ticket.",
      }),
    );

    expect(event && getRealtimeEventUpdate(event)).toMatchObject({
      kind: "transcript",
      item: {
        id: "user-item-2",
        text: "I need a ticket.",
        final: true,
      },
    });
  });

  it("ignores invalid JSON", () => {
    expect(parseRealtimeEvent("{")).toBeNull();
  });
});
