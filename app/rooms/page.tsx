import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { RoomsHub } from './_components/rooms-hub';

export default async function RoomsPage() {
  const { user } = await requireAuth();
  const authedUser = user!;
  const supabase = await createServerSupabaseClient();

  const { data: memberships } = await supabase
    .from('room_members')
    .select('room_id, last_read_at, rooms(id, name, code, owner_id, created_at)')
    .eq('user_id', authedUser.id);

  const roomIds = memberships?.map((membership) => membership.room_id).filter(Boolean) ?? [];
  const { data: messageRows } = roomIds.length
    ? await supabase.from('messages').select('room_id, created_at').in('room_id', roomIds).order('created_at', { ascending: false })
    : { data: [] };

  const latestMessageByRoom = new Map<string, string>();
  (messageRows ?? []).forEach((message) => {
    if (!latestMessageByRoom.has(message.room_id)) {
      latestMessageByRoom.set(message.room_id, message.created_at);
    }
  });

  const initialRooms = (memberships
      ?.map((membership) => {
        const room = membership.rooms?.[0];
        if (!room) return null;

        const latestMessageCreatedAt = latestMessageByRoom.get(room.id) ?? null;
        const lastReadAt = membership.last_read_at;
        const hasUnread =
          latestMessageCreatedAt !== null &&
          (lastReadAt === null || new Date(latestMessageCreatedAt).getTime() > new Date(lastReadAt).getTime());

        return {
          id: room.id,
          name: room.name,
          code: room.code,
          ownerId: room.owner_id,
          createdAt: room.created_at,
          lastReadAt,
          latestMessageCreatedAt,
          hasUnread
        };
      })
      .filter((room) => room !== null) as {
        id: string;
        name: string;
        code: string;
        ownerId: string;
        createdAt: string;
        lastReadAt: string | null;
        latestMessageCreatedAt: string | null;
        hasUnread: boolean;
      }[]) ?? [];

  return <RoomsHub email={authedUser.email ?? undefined} initialRooms={initialRooms} />;
}
