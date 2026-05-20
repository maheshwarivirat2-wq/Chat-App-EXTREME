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
      className={`w-full rounded-xl bg-accentViolet px-4 py-2.5 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
