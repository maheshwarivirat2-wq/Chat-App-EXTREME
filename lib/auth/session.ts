import { createServerSupabaseClient } from '@/lib/supabase/server';

export const getServerAuthSnapshot = async () => {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const {
    data: { session }
  } = user ? await supabase.auth.getSession() : { data: { session: null } };

  return { session, user: user ?? null };
};
