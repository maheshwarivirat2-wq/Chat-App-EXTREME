import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const ROOM_CODE_LENGTH = 6;

const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: ROOM_CODE_LENGTH }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as { name?: string };
  const name = body?.name?.trim();

  if (!name || name.length > 60) return NextResponse.json({ error: 'Room name must be 1-60 characters.' }, { status: 400 });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateRoomCode();
    const { data: room, error } = await supabase
      .from('rooms')
      .insert({ name, owner_id: user.id, code })
      .select('id, name, code, owner_id, created_at')
      .single();

    if (error) {
      if (error.code === '23505') continue;
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await supabase.from('room_members').insert({ room_id: room.id, user_id: user.id });

    return NextResponse.json({
      room: {
        id: room.id,
        name: room.name,
        code: room.code,
        ownerId: room.owner_id,
        createdAt: room.created_at
      }
    });
  }

  return NextResponse.json({ error: 'Could not generate a unique room code.' }, { status: 500 });
}
