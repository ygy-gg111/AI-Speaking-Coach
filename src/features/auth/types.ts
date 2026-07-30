export type UserProfileSummary = {
  displayName: string | null;
  level: string;
  dailyGoalMinutes: number;
  nativeLanguage: string;
  targetLanguage: string;
};

export type CurrentUser = {
  id: string;
  email: string;
  locale: string;
  createdAt: string;
  profile: UserProfileSummary;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type RegistrationInput = AuthCredentials & {
  displayName: string;
  locale: string;
};

export type ProfileUpdateInput = {
  displayName: string;
  level: string;
  dailyGoalMinutes: number;
};
