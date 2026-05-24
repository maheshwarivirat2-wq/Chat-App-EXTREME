import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { RoomsHub } from './_components/rooms-hub';

export default async function RoomsPage() {
  const { user } = await requireAuth();
  const authedUser = user!;
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('room_members')
    .select('rooms(id, name, code, owner_id, created_at)')
    .eq('user_id', authedUser.id);

  const initialRooms =
    data
      ?.map((row) => row.rooms)
      .flat()
      .filter(Boolean)
      .map((room) => ({
        id: room.id,
        name: room.name,
        code: room.code,
        ownerId: room.owner_id,
        createdAt: room.created_at
      })) ?? [];

  return <RoomsHub email={authedUser.email ?? undefined} initialRooms={initialRooms} />;
}
