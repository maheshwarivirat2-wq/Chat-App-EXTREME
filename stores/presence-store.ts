'use client';

import { create } from 'zustand';
import type { PresenceState } from '@/lib/types/presence';

type PresenceMap = Record<string, PresenceState>;

type PresenceStore = {
  byUserId: PresenceMap;
  channelReady: boolean;
  setChannelReady: (ready: boolean) => void;
  upsertPresence: (presence: PresenceState) => void;
};

export const usePresenceStore = create<PresenceStore>((set) => ({
  byUserId: {},
  channelReady: false,
  setChannelReady: (channelReady) => set({ channelReady }),
  upsertPresence: (presence) =>
    set((state) => ({ byUserId: { ...state.byUserId, [presence.userId]: presence } }))
}));
