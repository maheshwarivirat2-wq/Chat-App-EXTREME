export function AuthTabs({
  mode,
  onChange
}: {
  mode: 'login' | 'signup';
  onChange: (mode: 'login' | 'signup') => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-borderSoft bg-white/5 p-1">
      <button
        className={`rounded-lg px-3 py-2 text-sm font-medium ${mode === 'login' ? 'bg-accentViolet text-white' : 'text-textMuted'}`}
        onClick={() => onChange('login')}
      >
        Login
      </button>
      <button
        className={`rounded-lg px-3 py-2 text-sm font-medium ${mode === 'signup' ? 'bg-accentViolet text-white' : 'text-textMuted'}`}
        onClick={() => onChange('signup')}
      >
        Sign Up
      </button>
    </div>
  );
}
