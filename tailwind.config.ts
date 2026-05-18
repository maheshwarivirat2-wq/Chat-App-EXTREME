import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './stores/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#0B0F19',
        surface: 'rgba(255,255,255,0.06)',
        borderSoft: 'rgba(255,255,255,0.12)',
        textPrimary: '#EAF1FF',
        textMuted: '#9FB0C7',
        accentViolet: '#7C3AED',
        accentCyan: '#00E5FF'
      },
      boxShadow: {
        glow: '0 0 45px rgba(124,58,237,0.28)'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
};

export default config;
