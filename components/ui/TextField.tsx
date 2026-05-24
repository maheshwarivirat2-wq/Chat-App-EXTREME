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
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-gray-500 outline-none ring-accentViolet/40 transition duration-200 focus:border-accentViolet/50 focus:ring-2"
      />
    </label>
  );
}
