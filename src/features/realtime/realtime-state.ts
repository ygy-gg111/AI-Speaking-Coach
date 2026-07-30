import type { RealtimeConnectionState } from "./types";

const allowedTransitions: Record<
  RealtimeConnectionState,
  RealtimeConnectionState[]
> = {
  idle: ["requesting-permission", "connecting"],
  "requesting-permission": ["connecting", "error", "ended"],
  connecting: ["connected", "error", "ended"],
  connected: ["listening", "ai-thinking", "reconnecting", "ended", "error"],
  listening: ["connected", "user-speaking", "ai-thinking", "reconnecting", "ended", "error"],
  "user-speaking": ["listening", "ai-thinking", "reconnecting", "ended", "error"],
  "ai-thinking": ["ai-speaking", "listening", "reconnecting", "ended", "error"],
  "ai-speaking": ["listening", "reconnecting", "ended", "error"],
  reconnecting: ["connected", "listening", "error", "ended"],
  ended: ["idle", "connecting"],
  error: ["idle", "connecting"],
};

export function canTransitionRealtimeState(
  from: RealtimeConnectionState,
  to: RealtimeConnectionState,
) {
  return allowedTransitions[from].includes(to);
}
