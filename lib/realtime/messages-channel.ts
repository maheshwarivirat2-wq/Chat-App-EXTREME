import type { SupabaseClient } from '@supabase/supabase-js';

export const subscribeToRoomMessages = (
  supabase: SupabaseClient,
  roomId: string,
  onInsert: (payload: unknown) => void
) => {
  return supabase
    .channel(`room:${roomId}:messages`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, onInsert)
    .subscribe();
};
