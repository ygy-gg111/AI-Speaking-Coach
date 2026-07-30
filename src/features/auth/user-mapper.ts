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
  } | null;
};

export function toCurrentUser(user: UserWithProfile): CurrentUser {
  return {
    id: user.id,
    email: user.email,
    locale: user.locale,
    createdAt: user.createdAt.toISOString(),
    profile: user.profile ?? {
      displayName: null,
      level: "A2",
      dailyGoalMinutes: 10,
      nativeLanguage: "zh-CN",
      targetLanguage: "en",
    },
  };
}
