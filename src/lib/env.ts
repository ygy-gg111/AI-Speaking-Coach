import { z } from "zod";

const optionalString = z.preprocess(
  (value) => value === "" ? undefined : value,
  z.string().min(1).optional(),
);
const optionalUrl = z.preprocess(
  (value) => value === "" ? undefined : value,
  z.url().optional(),
);

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  OPENAI_API_KEY: optionalString,
  OPENAI_REALTIME_MODEL: z.string().default("gpt-realtime"),
  OPENAI_REALTIME_VOICE: z.string().default("marin"),
  OPENAI_TEXT_MODEL: z.string().default("gpt-5.6-sol"),
  OPENAI_PROXY_URL: optionalUrl,
  REALTIME_MAX_CONCURRENT_SESSIONS: z.coerce.number().int().min(1).max(10).default(1),
  REALTIME_DAILY_MINUTES: z.coerce.number().int().min(1).max(1440).default(60),
  AUTH_PRIVATE_KEY: z.string().min(1).optional(),
  AUTH_PUBLIC_KEY: z.string().min(1).optional(),
  AUTH_KEY_ID: z.string().min(1).max(64).default("primary"),
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_REALTIME_MODEL: process.env.OPENAI_REALTIME_MODEL,
    OPENAI_REALTIME_VOICE: process.env.OPENAI_REALTIME_VOICE,
    OPENAI_TEXT_MODEL: process.env.OPENAI_TEXT_MODEL,
    OPENAI_PROXY_URL: process.env.OPENAI_PROXY_URL,
    REALTIME_MAX_CONCURRENT_SESSIONS: process.env.REALTIME_MAX_CONCURRENT_SESSIONS,
    REALTIME_DAILY_MINUTES: process.env.REALTIME_DAILY_MINUTES,
    AUTH_PRIVATE_KEY: process.env.AUTH_PRIVATE_KEY,
    AUTH_PUBLIC_KEY: process.env.AUTH_PUBLIC_KEY,
    AUTH_KEY_ID: process.env.AUTH_KEY_ID,
  });
}
