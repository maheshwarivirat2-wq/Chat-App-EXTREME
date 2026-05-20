import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseEnv } from '@/lib/supabase/env';

export const createClient = () => {
  const { url, anonKey, isConfigured } = getSupabaseEnv();

  if (!isConfigured || !url || !anonKey) {
    throw new Error(
      'Supabase browser client is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return createBrowserClient(url, anonKey);
};
