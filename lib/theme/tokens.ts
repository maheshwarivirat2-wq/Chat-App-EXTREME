export type ThemePresetKey = 'neo-violet' | 'neo-cyan';

export const themePresets: Record<ThemePresetKey, { accent: string; accentSoft: string }> = {
  'neo-violet': {
    accent: '#7C3AED',
    accentSoft: 'rgba(124, 58, 237, 0.24)'
  },
  'neo-cyan': {
    accent: '#00E5FF',
    accentSoft: 'rgba(0, 229, 255, 0.24)'
  }
};
