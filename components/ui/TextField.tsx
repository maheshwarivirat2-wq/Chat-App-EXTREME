export function TextField({
  label,
  type,
  value,
  onChange,
  placeholder
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-textMuted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-borderSoft bg-white/5 px-3 py-2.5 text-textPrimary outline-none ring-accentViolet/50 transition focus:ring"
      />
    </label>
  );
}
