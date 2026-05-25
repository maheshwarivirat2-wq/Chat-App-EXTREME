import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

export const subscribeToRoomMessages = (
  supabase: SupabaseClient,
  roomId: string,
  onInsert: (payload: unknown) => void
) => {
  const channel = supabase
    .channel(`room:${roomId}:messages`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, onInsert);

  const ready = new Promise<RealtimeChannel>((resolve, reject) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        resolve(channel);
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        reject(new Error(`Failed to subscribe to room messages: ${status}`));
      }
    });
  });

  return { channel, ready };
};
