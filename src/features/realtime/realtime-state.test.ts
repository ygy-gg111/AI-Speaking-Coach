import { describe, expect, it } from "vitest";

import { canTransitionRealtimeState } from "./realtime-state";

describe("realtime connection state", () => {
  it("allows a normal connection flow", () => {
    expect(canTransitionRealtimeState("idle", "connecting")).toBe(true);
    expect(canTransitionRealtimeState("connecting", "connected")).toBe(true);
    expect(canTransitionRealtimeState("connected", "listening")).toBe(true);
    expect(canTransitionRealtimeState("listening", "user-speaking")).toBe(true);
    expect(canTransitionRealtimeState("user-speaking", "ai-thinking")).toBe(true);
    expect(canTransitionRealtimeState("ai-thinking", "ai-speaking")).toBe(true);
  });

  it("rejects an invalid direct transition", () => {
    expect(canTransitionRealtimeState("idle", "connected")).toBe(false);
  });
});
