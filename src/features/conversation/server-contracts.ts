import { z } from "zod";

export const createConversationSchema = z.object({
  sceneId: z.string().trim().min(1).max(128),
});

export const createMessageSchema = z.object({
  clientEventId: z.string().trim().min(1).max(128).optional(),
  role: z.enum(["USER", "ASSISTANT"]),
  content: z.string().trim().min(1).max(8_000),
  transcript: z.string().trim().max(8_000).optional(),
});

export const completeConversationSchema = z.object({
  durationSeconds: z.number().int().min(0).max(60 * 60).optional(),
  summary: z.string().trim().max(2_000).optional(),
});
