import { create } from "zustand";

import type {
  RealtimeConnectionState,
  RealtimeTranscriptItem,
} from "@/features/realtime/types";
import { canTransitionRealtimeState } from "@/features/realtime/realtime-state";

type RealtimeStore = {
  state: RealtimeConnectionState;
  transcript: RealtimeTranscriptItem[];
  transitionTo: (state: RealtimeConnectionState) => boolean;
  appendTranscript: (item: RealtimeTranscriptItem) => void;
  upsertTranscript: (item: RealtimeTranscriptItem) => void;
  updateTranscript: (id: string, text: string, final?: boolean) => void;
  reset: () => void;
};

export const useRealtimeStore = create<RealtimeStore>((set) => ({
  state: "idle",
  transcript: [],
  transitionTo: (nextState) => {
    let changed = false;
    set((current) => {
      if (!canTransitionRealtimeState(current.state, nextState)) {
        return current;
      }
      changed = true;
      return { state: nextState };
    });
    return changed;
  },
  appendTranscript: (item) =>
    set((current) => ({ transcript: [...current.transcript, item] })),
  upsertTranscript: (item) =>
    set((current) => {
      const index = current.transcript.findIndex(
        (transcriptItem) => transcriptItem.id === item.id,
      );
      if (index === -1) {
        return { transcript: [...current.transcript, item] };
      }

      const transcript = [...current.transcript];
      transcript[index] = item;
      return { transcript };
    }),
  updateTranscript: (id, text, final = false) =>
    set((current) => ({
      transcript: current.transcript.map((item) =>
        item.id === id ? { ...item, text, final } : item,
      ),
    })),
  reset: () => set({ state: "idle", transcript: [] }),
}));
