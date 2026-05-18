export function StatusMessage({ message, error = false }: { message: string; error?: boolean }) {
  return <p className={`text-sm ${error ? 'text-rose-300' : 'text-emerald-300'}`}>{message}</p>;
}
