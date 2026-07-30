import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_REALTIME_MODEL: z.string().default("gpt-realtime-2.1"),
  OPENAI_REALTIME_VOICE: z.string().default("marin"),
  OPENAI_TEXT_MODEL: z.string().default("gpt-5.6-sol"),
  AUTH_SECRET: z.string().min(16).optional(),
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_REALTIME_MODEL: process.env.OPENAI_REALTIME_MODEL,
    OPENAI_REALTIME_VOICE: process.env.OPENAI_REALTIME_VOICE,
    OPENAI_TEXT_MODEL: process.env.OPENAI_TEXT_MODEL,
    AUTH_SECRET: process.env.AUTH_SECRET,
  });
}
