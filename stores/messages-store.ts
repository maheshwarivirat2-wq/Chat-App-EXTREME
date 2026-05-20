'use client';

import { create } from 'zustand';
import type { ChatMessage } from '@/lib/types/chat';

type MessagesState = {
  activeRoomId: string | null;
  byRoom: Record<string, ChatMessage[]>;
  setActiveRoom: (roomId: string | null) => void;
  upsertMessage: (message: ChatMessage) => void;
  reset: () => void;
};

export const useMessagesStore = create<MessagesState>((set) => ({
  activeRoomId: null,
  byRoom: {},
  setActiveRoom: (roomId) => set({ activeRoomId: roomId }),
  upsertMessage: (message) =>
    set((state) => {
      const existing = state.byRoom[message.roomId] ?? [];
      const deduped = existing.some((m) => m.id === message.id)
        ? existing.map((m) => (m.id === message.id ? message : m))
        : [...existing, message];

      return {
        byRoom: {
          ...state.byRoom,
          [message.roomId]: deduped.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        }
      };
    }),
  reset: () => set({ activeRoomId: null, byRoom: {} })
}));
