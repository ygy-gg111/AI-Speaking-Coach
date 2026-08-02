import { getServerEnv } from "../../lib/env";

export type SessionContext = {
  sceneName: string;
  learnerLevel: string;
  voice?: "marin" | "cedar";
  speed?: number;
  correctionFrequency?: "gentle" | "balanced" | "detailed";
  learningGoal?: "travel" | "work" | "daily" | "interview";
  showChinese?: boolean;
};

const correctionInstructions = {
  gentle: "Only correct mistakes that make the learner difficult to understand.",
  balanced: "Gently correct one important mistake at a time.",
  detailed: "After each learner turn, briefly correct the important language mistakes.",
} as const;

export function createRealtimeSessionConfig(context: SessionContext) {
  const env = getServerEnv();

  return {
    type: "realtime" as const,
    model: env.OPENAI_REALTIME_MODEL,
    instructions: [
      "You are a patient English speaking coach.",
      `Practice scene: ${context.sceneName}.`,
      `Learner CEFR level: ${context.learnerLevel}.`,
      `Primary learning goal: ${context.learningGoal ?? "daily"} English.`,
      "Keep turns short, natural, and encouraging.",
      context.showChinese ?? true
        ? "Speak in English and provide a concise Chinese explanation when it helps clarify a correction."
        : "Speak only in English, including all corrections and explanations.",
      correctionInstructions[context.correctionFrequency ?? "balanced"],
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
        voice: context.voice ?? env.OPENAI_REALTIME_VOICE,
        speed: context.speed ?? 1,
      },
    },
  };
}
