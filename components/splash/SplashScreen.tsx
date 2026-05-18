import { StudioLogo } from './StudioLogo';

export function SplashScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-obsidian">
      <div className="animate-pulse space-y-5 text-center">
        <StudioLogo />
        <p className="text-sm tracking-[0.3em] text-textMuted">CHAT APP EXTREME</p>
      </div>
    </main>
  );
}
