'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type RoomDetails = {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  theme_key: string | null;
};

type MemberRow = {
  user_id: string;
  profiles: { full_name: string | null; email: string | null }[] | null;
  presence_state: { custom_status: string | null }[] | null;
};

type ThemeOption = { key: string; label: string; description: string };

const THEME_OPTIONS: ThemeOption[] = [
  { key: 'default_dark', label: 'Default Dark', description: 'Balanced dark UI with indigo accents.' },
  { key: 'midnight_blue', label: 'Midnight Blue', description: 'Deeper blues for calmer contrast.' },
  { key: 'cyberpunk', label: 'Cyberpunk', description: 'Neon-inspired pink and teal palette.' }
];

export default function RoomSettingsPage() {
  const params = useParams<{ id: string }>();
  const roomId = params.id;
  const supabase = useMemo(() => createClient(), []);

  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isOwner = !!room && currentUserId === room.owner_id;

  const loadData = async () => {
    setLoading(true);
    setStatus(null);

    const {
      data: { user }
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);

    const [{ data: roomData, error: roomError }, { data: memberData, error: memberError }] = await Promise.all([
      supabase.from('rooms').select('id, name, code, owner_id, theme_key').eq('id', roomId).maybeSingle(),
      supabase
        .from('room_members')
        .select('user_id, profiles(full_name, email), presence_state(custom_status)')
        .eq('room_id', roomId)
    ]);

    if (roomError || !roomData) {
      setStatus(roomError?.message ?? 'Room not found.');
      setLoading(false);
      return;
    }

    if (memberError) {
      setStatus(memberError.message);
      setLoading(false);
      return;
    }

    setRoom(roomData as RoomDetails);
    setMembers((memberData as MemberRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, [roomId]);

  const copyCode = async () => {
    if (!room?.code) return;
    await navigator.clipboard.writeText(room.code);
    setStatus('Room code copied to clipboard.');
  };

  const updateTheme = async (themeKey: string) => {
    if (!room) return;
    setActionLoading(`theme-${themeKey}`);
    setStatus(null);

    const { error } = await supabase.from('rooms').update({ theme_key: themeKey }).eq('id', room.id);

    if (error) {
      setStatus(error.message);
      setActionLoading(null);
      return;
    }

    setRoom({ ...room, theme_key: themeKey });
    setStatus(`Theme updated to ${THEME_OPTIONS.find((theme) => theme.key === themeKey)?.label ?? themeKey}.`);
    setActionLoading(null);
  };

  const removeMember = async (memberUserId: string) => {
    if (!isOwner || !room) return;
    setActionLoading(`remove-${memberUserId}`);
    const { error } = await supabase.from('room_members').delete().eq('room_id', room.id).eq('user_id', memberUserId);
    if (error) {
      setStatus(error.message);
      setActionLoading(null);
      return;
    }
    setMembers((prev) => prev.filter((member) => member.user_id !== memberUserId));
    setStatus('Member removed from this room.');
    setActionLoading(null);
  };

  const leaveRoom = async () => {
    if (!currentUserId) return;
    setActionLoading('leave-room');
    const { error } = await supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', currentUserId);
    if (error) {
      setStatus(error.message);
      setActionLoading(null);
      return;
    }
    setStatus('You left this room. Return to Room Hub to join or open another room.');
    setActionLoading(null);
  };

  const deleteRoom = async () => {
    if (!room || !isOwner) return;
    setActionLoading('delete-room');
    const { error } = await supabase.from('rooms').delete().eq('id', room.id);
    if (error) {
      setStatus(error.message);
      setActionLoading(null);
      return;
    }
    setStatus('Room deleted.');
    setActionLoading(null);
  };

  if (loading) return <main className="min-h-screen bg-[#0B0F19] px-4 py-6 text-white">Loading settings...</main>;

  return (
    <main className="min-h-screen bg-[#0B0F19] px-4 py-6 text-white">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <Link className="w-fit rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800" href={`/rooms/${roomId}`}>
          ← Back to Chat
        </Link>

        <header className="rounded-2xl border border-slate-800 bg-[#121826] p-5">
          <h1 className="text-2xl font-bold">{room?.name ?? 'Room Settings'}</h1>
          <button className="mt-2 rounded-lg border border-slate-600 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-200 hover:bg-slate-700/50" onClick={copyCode}>
            Code: {room?.code ?? '------'} (tap to copy)
          </button>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-[#121826] p-5">
          <h2 className="text-lg font-semibold">Theme Selector</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {THEME_OPTIONS.map((theme) => {
              const selected = room?.theme_key === theme.key;
              return (
                <button
                  key={theme.key}
                  className={`rounded-xl border p-3 text-left transition ${
                    selected ? 'border-indigo-400 bg-indigo-500/20' : 'border-slate-700 bg-slate-900/70 hover:border-slate-500'
                  }`}
                  disabled={!!actionLoading}
                  onClick={() => updateTheme(theme.key)}
                >
                  <p className="font-medium">{theme.label}</p>
                  <p className="mt-1 text-xs text-slate-300">{theme.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#121826] p-5">
          <h2 className="text-lg font-semibold">Members</h2>
          <div className="mt-4 space-y-3">
            {members.map((member) => {
              const profile = member.profiles?.[0];
              const name = profile?.full_name?.trim() || 'Unknown User';
              const email = profile?.email ?? 'No email';
              const customStatus = member.presence_state?.[0]?.custom_status?.trim() || 'No status';
              const canRemove = isOwner && member.user_id !== currentUserId;

              return (
                <div key={member.user_id} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold uppercase">
                      {name[0] ?? 'U'}
                    </div>
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-slate-400">{email}</p>
                      <p className="text-xs text-cyan-300">{customStatus}</p>
                    </div>
                  </div>
                  {canRemove ? (
                    <button
                      className="rounded-lg border border-rose-400/40 bg-rose-500/15 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/25"
                      disabled={actionLoading === `remove-${member.user_id}`}
                      onClick={() => removeMember(member.user_id)}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-3 pb-8">
          {isOwner ? (
            <button
              className="w-full rounded-xl border-2 border-rose-500 bg-rose-500/10 px-4 py-3 text-base font-semibold text-rose-200 hover:bg-rose-500/20"
              disabled={actionLoading === 'delete-room'}
              onClick={deleteRoom}
            >
              Delete Room
            </button>
          ) : (
            <button
              className="w-full rounded-xl border border-amber-400/50 bg-amber-500/10 px-4 py-3 text-base font-semibold text-amber-200 hover:bg-amber-500/20"
              disabled={actionLoading === 'leave-room'}
              onClick={leaveRoom}
            >
              Leave Room
            </button>
          )}
        </section>

        {status ? <p className="text-sm text-slate-300">{status}</p> : null}
      </section>
    </main>
  );
}
