import { createServerSupabaseClient } from '@/lib/supabase/server';

export const getServerAuthSnapshot = async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return { session, user: session?.user ?? null };
};
