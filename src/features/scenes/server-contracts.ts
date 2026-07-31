import { z } from "zod";

export const sceneListQuerySchema = z.object({
  category: z
    .enum(["daily", "travel", "work", "education", "social"])
    .optional(),
  difficulty: z.coerce.number().int().min(1).max(5).optional(),
  query: z.string().trim().max(80).optional(),
});
