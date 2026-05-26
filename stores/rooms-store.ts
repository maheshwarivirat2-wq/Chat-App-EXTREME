'use client';

import { create } from 'zustand';

export type RoomSummary = {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  createdAt: string;
  lastReadAt: string | null;
  latestMessageCreatedAt: string | null;
  hasUnread: boolean;
};

type RoomsState = {
  rooms: RoomSummary[];
  setRooms: (rooms: RoomSummary[]) => void;
  addRoom: (room: RoomSummary) => void;
};

export const useRoomsStore = create<RoomsState>((set) => ({
  rooms: [],
  setRooms: (rooms) => set({ rooms }),
  addRoom: (room) =>
    set((state) => ({
      rooms: state.rooms.some((existing) => existing.id === room.id) ? state.rooms : [room, ...state.rooms]
    }))
}));
