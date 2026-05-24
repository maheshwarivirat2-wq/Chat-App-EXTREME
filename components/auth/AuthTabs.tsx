export function AuthTabs({
  mode,
  onChange
}: {
  mode: 'login' | 'signup';
  onChange: (mode: 'login' | 'signup') => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
      <button
        className={`rounded-lg px-3 py-2 text-sm font-medium ${mode === 'login' ? 'bg-accentViolet text-white shadow-[0_0_20px_rgba(124,58,237,0.35)]' : 'text-textMuted hover:text-white'}`}
        onClick={() => onChange('login')}
      >
        Login
      </button>
      <button
        className={`rounded-lg px-3 py-2 text-sm font-medium ${mode === 'signup' ? 'bg-accentViolet text-white shadow-[0_0_20px_rgba(124,58,237,0.35)]' : 'text-textMuted hover:text-white'}`}
        onClick={() => onChange('signup')}
      >
        Sign Up
      </button>
    </div>
  );
}
