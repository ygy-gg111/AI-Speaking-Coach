import { create } from "zustand";

import type {
  RealtimeConnectionState,
  RealtimeTranscriptItem,
} from "@/features/realtime/types";

type RealtimeStore = {
  state: RealtimeConnectionState;
  transcript: RealtimeTranscriptItem[];
  setState: (state: RealtimeConnectionState) => void;
  appendTranscript: (item: RealtimeTranscriptItem) => void;
  reset: () => void;
};

export const useRealtimeStore = create<RealtimeStore>((set) => ({
  state: "idle",
  transcript: [],
  setState: (state) => set({ state }),
  appendTranscript: (item) =>
    set((current) => ({ transcript: [...current.transcript, item] })),
  reset: () => set({ state: "idle", transcript: [] }),
}));
