import { createServerSupabaseClient } from '@/lib/supabase/server';

export const getServerAuthSnapshot = async () => {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    const {
      data: { session }
    } = user ? await supabase.auth.getSession() : { data: { session: null } };

    return { session, user: user ?? null };
  } catch (error) {
    console.error('[auth] Failed to initialize Supabase auth snapshot.', error);
    return { session: null, user: null };
  }
};
