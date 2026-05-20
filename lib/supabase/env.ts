const normalizeEnv = (value?: string) => {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim() || undefined;
  }

  return trimmed;
};

const firstPresentEnv = (...values: Array<string | undefined>) => {
  for (const value of values) {
    const normalized = normalizeEnv(value);
    if (normalized) return normalized;
  }

  return undefined;
};

export const getSupabaseEnv = () => {
  const url = firstPresentEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL);
  const anonKey = firstPresentEnv(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY
  );

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey)
  };
};
