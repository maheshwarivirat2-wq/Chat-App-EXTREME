import type { SupabaseClient } from '@supabase/supabase-js';

export const subscribeToPresence = (supabase: SupabaseClient, onChange: (payload: unknown) => void) => {
  return supabase
    .channel('global:presence_state')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'presence_state' }, onChange)
    .subscribe();
};
