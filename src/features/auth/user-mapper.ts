import type { CurrentUser } from "./types";

type UserWithProfile = {
  id: string;
  email: string;
  locale: string;
  createdAt: Date;
  profile: {
    displayName: string | null;
    level: string;
    dailyGoalMinutes: number;
    nativeLanguage: string;
    targetLanguage: string;
    voice: string;
    speechSpeed: number;
    correctionFrequency: string;
    learningGoal: string;
    showChinese: boolean;
    autoPlay: boolean;
    saveAudio: boolean;
    saveConversation: boolean;
  } | null;
};

export function toCurrentUser(user: UserWithProfile): CurrentUser {
  return {
    id: user.id,
    email: user.email,
    locale: user.locale,
    createdAt: user.createdAt.toISOString(),
    profile: {
      displayName: user.profile?.displayName ?? null,
      level: user.profile?.level ?? "A2",
      dailyGoalMinutes: user.profile?.dailyGoalMinutes ?? 10,
      nativeLanguage: user.profile?.nativeLanguage ?? "zh-CN",
      targetLanguage: user.profile?.targetLanguage ?? "en",
      preferences: {
        voice: user.profile?.voice === "cedar" ? "cedar" : "marin",
        speed: user.profile?.speechSpeed ?? 1,
        correctionFrequency:
          user.profile?.correctionFrequency === "gentle" ||
          user.profile?.correctionFrequency === "detailed"
            ? user.profile.correctionFrequency
            : "balanced",
        learningGoal:
          user.profile?.learningGoal === "travel" ||
          user.profile?.learningGoal === "work" ||
          user.profile?.learningGoal === "interview"
            ? user.profile.learningGoal
            : "daily",
        showChinese: user.profile?.showChinese ?? true,
        autoPlay: user.profile?.autoPlay ?? true,
        saveAudio: user.profile?.saveAudio ?? false,
        saveConversation: user.profile?.saveConversation ?? true,
      },
    },
  };
}
