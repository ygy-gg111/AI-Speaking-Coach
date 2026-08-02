import { afterEach, describe, expect, it, vi } from "vitest";

import { createRealtimeSessionConfig } from "./session-config";

describe("Realtime session configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds an audio session with transcription and server VAD", () => {
    vi.stubEnv("OPENAI_REALTIME_MODEL", "gpt-realtime-2.1");
    vi.stubEnv("OPENAI_REALTIME_VOICE", "marin");

    const config = createRealtimeSessionConfig({
      sceneName: "Airport Check-in",
      learnerLevel: "A2",
    });

    expect(config).toMatchObject({
      type: "realtime",
      model: "gpt-realtime-2.1",
      output_modalities: ["audio"],
      audio: {
        input: {
          transcription: {
            model: "gpt-4o-mini-transcribe",
            language: "en",
          },
          turn_detection: {
            type: "server_vad",
            create_response: true,
            interrupt_response: true,
          },
        },
        output: { voice: "marin" },
      },
    });
    expect(config.instructions).toContain("Airport Check-in");
    expect(config.instructions).toContain("A2");
  });

  it("applies learner voice, speed, language, goal, and correction preferences", () => {
    vi.stubEnv("OPENAI_REALTIME_MODEL", "gpt-realtime-2.1");
    vi.stubEnv("OPENAI_REALTIME_VOICE", "marin");

    const config = createRealtimeSessionConfig({
      sceneName: "Job interview",
      learnerLevel: "B1",
      voice: "cedar",
      speed: 0.75,
      correctionFrequency: "detailed",
      learningGoal: "interview",
      showChinese: false,
    });

    expect(config.audio.output).toEqual({ voice: "cedar", speed: 0.75 });
    expect(config.instructions).toContain("Primary learning goal: interview");
    expect(config.instructions).toContain("After each learner turn");
    expect(config.instructions).toContain("Speak only in English");
  });
});
