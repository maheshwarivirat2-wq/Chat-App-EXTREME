'use client';

import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

type AuthState = {
  user: User | null;
  session: Session | null;
  status: 'idle' | 'loading' | 'ready';
  setSession: (session: Session | null) => void;
  clearSession: () => void;
  setStatus: (status: AuthState['status']) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  status: 'idle',
  setSession: (session) => set({ session, user: session?.user ?? null, status: 'ready' }),
  clearSession: () => set({ session: null, user: null, status: 'ready' }),
  setStatus: (status) => set({ status })
}));
