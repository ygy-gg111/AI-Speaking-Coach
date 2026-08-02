export type UserPreferences = {
  voice: "marin" | "cedar";
  speed: number;
  correctionFrequency: "gentle" | "balanced" | "detailed";
  learningGoal: "travel" | "work" | "daily" | "interview";
  showChinese: boolean;
  autoPlay: boolean;
  saveAudio: boolean;
  saveConversation: boolean;
};

export type UserProfileSummary = {
  displayName: string | null;
  level: string;
  dailyGoalMinutes: number;
  nativeLanguage: string;
  targetLanguage: string;
  preferences: UserPreferences;
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

export type PreferencesUpdateInput = UserPreferences;
