import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateRoomCode } from '@/lib/rooms/code';

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as { name?: string; themeKey?: 'neo-violet' | 'neo-cyan' };
  const name = body.name?.trim();
  const themeKey = body.themeKey ?? 'neo-violet';

  if (!name || name.length > 60) {
    return NextResponse.json({ error: 'Room name must be 1-60 characters.' }, { status: 400 });
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateRoomCode(6);
    const { data, error } = await supabase
      .from('rooms')
      .insert({ name, owner_id: user.id, code, theme_key: themeKey })
      .select('id, name, code, theme_key, owner_id, created_at')
      .single();

    if (!error) {
      return NextResponse.json({ room: data }, { status: 201 });
    }

    if (!error.message.toLowerCase().includes('duplicate') && error.code !== '23505') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Could not generate unique room code. Try again.' }, { status: 500 });
}
