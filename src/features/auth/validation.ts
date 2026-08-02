import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
});

export const registrationSchema = loginSchema.extend({
  displayName: z.string().trim().min(1).max(40),
  locale: z.enum(["zh-CN", "en"]),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  dailyGoalMinutes: z.number().int().min(5).max(120),
});

export const preferencesUpdateSchema = z.object({
  voice: z.enum(["marin", "cedar"]),
  speed: z.number().min(0.75).max(1.25),
  correctionFrequency: z.enum(["gentle", "balanced", "detailed"]),
  learningGoal: z.enum(["travel", "work", "daily", "interview"]),
  showChinese: z.boolean(),
  autoPlay: z.boolean(),
  saveAudio: z.boolean(),
  saveConversation: z.boolean(),
});

export function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
