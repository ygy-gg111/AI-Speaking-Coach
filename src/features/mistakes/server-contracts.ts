import { z } from "zod";

export const createMistakeSchema = z.object({
  conversationId: z.string().trim().min(1).max(128),
  original: z.string().trim().min(1).max(2_000),
  improved: z.string().trim().min(1).max(2_000),
  reason: z.object({
    "zh-CN": z.string().trim().min(1).max(2_000),
    en: z.string().trim().min(1).max(2_000),
  }),
  category: z
    .enum(["grammar", "vocabulary", "expression"])
    .default("expression"),
});

export const mistakeListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(200),
});
