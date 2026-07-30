import { getServerEnv } from "../../lib/env";

export type SessionContext = {
  sceneName: string;
  learnerLevel: string;
};

export function createRealtimeSessionConfig(context: SessionContext) {
  const env = getServerEnv();

  return {
    type: "realtime" as const,
    model: env.OPENAI_REALTIME_MODEL,
    instructions: [
      "You are a patient English speaking coach.",
      `Practice scene: ${context.sceneName}.`,
      `Learner CEFR level: ${context.learnerLevel}.`,
      "Keep turns short, natural, and encouraging.",
      "Speak only in English unless the learner explicitly asks for a Chinese explanation.",
      "Gently correct one important mistake at a time.",
    ].join(" "),
    output_modalities: ["audio"] as const,
    audio: {
      input: {
        transcription: {
          model: "gpt-4o-mini-transcribe",
          language: "en",
        },
        turn_detection: {
          type: "server_vad" as const,
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
          create_response: true,
          interrupt_response: true,
        },
      },
      output: {
        voice: env.OPENAI_REALTIME_VOICE,
      },
    },
  };
}
