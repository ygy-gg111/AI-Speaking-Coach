import { getServerEnv } from "@/lib/env";

type SessionContext = {
  sceneName: string;
  learnerLevel: string;
};

export function createRealtimeSessionConfig(context: SessionContext) {
  const env = getServerEnv();

  return {
    model: env.OPENAI_REALTIME_MODEL,
    voice: env.OPENAI_REALTIME_VOICE,
    instructions: [
      "You are a patient English speaking coach.",
      `Practice scene: ${context.sceneName}.`,
      `Learner CEFR level: ${context.learnerLevel}.`,
      "Keep turns short, natural, and encouraging.",
    ].join(" "),
  };
}
