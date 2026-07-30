export type RealtimeConnectionState =
  | "idle"
  | "requesting-permission"
  | "connecting"
  | "connected"
  | "listening"
  | "user-speaking"
  | "ai-thinking"
  | "ai-speaking"
  | "reconnecting"
  | "ended"
  | "error";

export type RealtimeTranscriptItem = {
  id: string;
  role: "user" | "assistant";
  text: string;
  final: boolean;
  createdAt?: string;
};
