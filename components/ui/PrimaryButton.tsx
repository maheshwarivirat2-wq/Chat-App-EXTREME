export function PrimaryButton({
  children,
  className = '',
  type = 'button',
  disabled = false
}: {
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`w-full rounded-xl border border-white/10 bg-accentViolet/90 px-4 py-2.5 font-semibold text-white shadow-[0_0_0_rgba(124,58,237,0)] transition duration-300 hover:bg-accentViolet hover:shadow-[0_0_30px_rgba(124,58,237,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentViolet/60 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
