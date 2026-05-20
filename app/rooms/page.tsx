import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { RoomsShell } from '@/components/rooms/RoomsShell';

export default async function RoomsPage() {
  const { user } = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const { data: rooms } = await supabase
    .from('room_members')
    .select('rooms(id,name,code,theme_key,owner_id,created_at)')
    .eq('user_id', user!.id);

  const mapped = (rooms ?? []).flatMap((entry) => (entry as { rooms: unknown }).rooms ? [(entry as { rooms: any }).rooms] : []);

  return <RoomsShell initialRooms={mapped} />;
}
