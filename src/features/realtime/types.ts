export type RealtimeConnectionState =
  | "idle"
  | "requesting-microphone"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "ended"
  | "error";

export type RealtimeTranscriptItem = {
  id: string;
  role: "user" | "assistant";
  text: string;
  final: boolean;
};
