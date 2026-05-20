import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as { code?: string };
  const code = body.code?.trim().toUpperCase();

  if (!code || !/^[A-Z0-9]{6}$/.test(code)) {
    return NextResponse.json({ error: 'Code must be exactly 6 alphanumeric characters.' }, { status: 400 });
  }

  const { data: room, error: roomError } = await supabase.from('rooms').select('id,name,code').eq('code', code).single();

  if (roomError || !room) {
    return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
  }

  const { error: memberError } = await supabase
    .from('room_members')
    .insert({ room_id: room.id, user_id: user.id });

  if (memberError && memberError.code !== '23505') {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  return NextResponse.json({ room }, { status: 200 });
}
