import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as { code?: string };
  const code = body?.code?.trim().toUpperCase();

  if (!code || !/^[A-Z0-9]{6}$/.test(code)) {
    return NextResponse.json({ error: 'Room code must be 6 letters/numbers.' }, { status: 400 });
  }

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, name, code, owner_id, created_at')
    .eq('code', code)
    .single();

  if (roomError || !room) return NextResponse.json({ error: 'Room not found.' }, { status: 404 });

  const { error: joinError } = await supabase
    .from('room_members')
    .insert({ room_id: room.id, user_id: user.id });

  if (joinError && joinError.code !== '23505') {
    return NextResponse.json({ error: joinError.message }, { status: 400 });
  }

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
