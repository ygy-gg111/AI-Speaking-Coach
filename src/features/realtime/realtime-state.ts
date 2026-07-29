import type { RealtimeConnectionState } from "./types";

const allowedTransitions: Record<
  RealtimeConnectionState,
  RealtimeConnectionState[]
> = {
  idle: ["requesting-microphone", "connecting"],
  "requesting-microphone": ["connecting", "error", "ended"],
  connecting: ["connected", "error", "ended"],
  connected: ["reconnecting", "ended", "error"],
  reconnecting: ["connected", "error", "ended"],
  ended: ["idle", "connecting"],
  error: ["idle", "connecting"],
};

export function canTransitionRealtimeState(
  from: RealtimeConnectionState,
  to: RealtimeConnectionState,
) {
  return allowedTransitions[from].includes(to);
}
