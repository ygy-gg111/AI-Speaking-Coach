import { z } from "zod";

export const vocabularyListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

export const createVocabularySchema = z.object({
  conversationId: z.string().trim().min(1).max(128),
  phrase: z.string().trim().min(1).max(500),
  meaning: z.object({
    "zh-CN": z.string().trim().min(1).max(2_000),
    en: z.string().trim().min(1).max(2_000),
  }),
  example: z.string().trim().min(1).max(1_000),
});

export const updateVocabularySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("favorite"), favorite: z.boolean() }),
  z.object({ action: z.literal("review") }),
]);
