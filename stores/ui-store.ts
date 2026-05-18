'use client';

import { create } from 'zustand';
import type { ThemePresetKey } from '@/lib/theme/tokens';

type UiStore = {
  splashDone: boolean;
  theme: ThemePresetKey;
  setSplashDone: (value: boolean) => void;
  setTheme: (theme: ThemePresetKey) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  splashDone: false,
  theme: 'neo-violet',
  setSplashDone: (splashDone) => set({ splashDone }),
  setTheme: (theme) => set({ theme })
}));
