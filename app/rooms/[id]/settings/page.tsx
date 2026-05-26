'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type RoomMember = {
  user_id: string;
  profiles: { full_name: string };
  custom_status: string;
};

type RoomRow = {
  name: string;
  code: string;
  theme_key: (typeof themes)[number] | null;
};
type MemberRow = {
  user_id: string;
  profiles: { full_name: string | null } | null;
};

const themes = ['neo-violet', 'neo-cyan'] as const;

export default function RoomSettingsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const roomId = params.id;
  const supabase = useMemo(() => createClient(), []);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<(typeof themes)[number]>('neo-violet');
  const [roomName, setRoomName] = useState('Room');
  const [roomCode, setRoomCode] = useState('----');
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [rawError, setRawError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      setRawError(null);
      try {
        const {
          data: { user },
          error: authError
        } = await supabase.auth.getUser();
        if (authError) throw authError;
        setCurrentUserId(user?.id ?? null);

        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('name, code, theme_key')
          .eq('id', roomId)
          .single();
        if (roomError) throw roomError;

        const room = roomData as RoomRow;
        setRoomName(room.name);
        setRoomCode(room.code);
        if (room.theme_key && themes.includes(room.theme_key)) {
          setSelectedTheme(room.theme_key);
        }

        const { data: memberData, error: membersError } = await supabase
          .from('room_members')
          .select('user_id, profiles(full_name)')
          .eq('room_id', roomId);
        if (membersError) throw membersError;

        const { data: presenceData, error: presenceError } = await supabase.from('presence_state').select('user_id, last_seen_at, custom_status');
        if (presenceError) throw presenceError;

        const presenceByUserId = new Map((presenceData ?? []).map((presence) => [presence.user_id, presence]));
        const mergedMembers: RoomMember[] = ((memberData ?? []) as unknown as MemberRow[]).map((member) => {
          const presence = presenceByUserId.get(member.user_id);
          return {
            user_id: member.user_id,
            profiles: { full_name: member.profiles?.full_name?.trim() || 'Unknown User' },
            custom_status: presence?.custom_status?.trim() || 'No status set'
          };
        });
        setMembers(mergedMembers);
      } catch (error) {
        setRawError((error as { message?: string })?.message || String(error));
      }
    };

    void loadSettings();
  }, [roomId, supabase]);

  const themeStyles = useMemo(
    () => ({
      'neo-violet': 'border-violet-400/70 bg-violet-500/20 text-violet-100',
      'neo-cyan': 'border-cyan-400/70 bg-cyan-500/20 text-cyan-100'
    }),
    []
  );

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
    } catch {
      // Ignore clipboard failures for this dummy UI shell.
    }

    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1200);
  };

  return (
    <main className="min-h-screen bg-[#0B0F19] text-white">
      {rawError ? <div className="sticky top-0 z-50 w-full bg-red-700 px-4 py-3 text-sm font-semibold text-white">{rawError}</div> : null}
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 pb-8 pt-6 sm:px-6">
        <header className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-5 shadow-lg shadow-black/20 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Room Settings</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-50 sm:text-3xl">{roomName}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-slate-200">Code: {roomCode}</span>
                <button
                  className="rounded-full border border-indigo-300/60 bg-indigo-500/20 px-3 py-1 font-medium text-indigo-100 transition hover:bg-indigo-500/35"
                  type="button"
                  onClick={handleCopyCode}
                >
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <Link className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700/50" href={`/rooms/${params.id}`}>
              Back
            </Link>
          </div>
        </header>

        <section className="mt-6 rounded-2xl border border-slate-700/70 bg-slate-900/50 p-5">
          <h2 className="text-lg font-semibold text-slate-100">Members</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {members.map((member) => (
              <div key={member.user_id} className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/70 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
                  {member.profiles.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-100">{member.profiles.full_name}</p>
                  <p className="truncate text-sm text-slate-400">{member.custom_status}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-700/70 bg-slate-900/50 p-5">
          <h2 className="text-lg font-semibold text-slate-100">Theme</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {themes.map((theme) => {
              const isSelected = selectedTheme === theme;

              return (
                <button
                  key={theme}
                  className={`rounded-xl border px-4 py-3 text-left capitalize transition ${
                    isSelected ? themeStyles[theme] : 'border-slate-700 bg-slate-800/70 text-slate-300 hover:bg-slate-700/70'
                  }`}
                  type="button"
                  onClick={async () => {
                    setRawError(null);
                    try {
                      const { error } = await supabase.from('rooms').update({ theme_key: theme }).eq('id', roomId);
                      if (error) throw error;
                      setSelectedTheme(theme);
                      router.refresh();
                    } catch (error) {
                      setRawError((error as { message?: string })?.message || String(error));
                    }
                  }}
                >
                  <p className="font-semibold">{theme}</p>
                  <p className="mt-1 text-xs opacity-85">{isSelected ? 'Selected' : 'Click to preview selection'}</p>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-auto pt-8">
          <button
            className="w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-rose-900/40 transition hover:bg-rose-500"
            type="button"
            onClick={async () => {
              if (!currentUserId) return;
              setRawError(null);
              try {
                const { error } = await supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', currentUserId);
                if (error) throw error;
                router.push('/rooms');
              } catch (error) {
                setRawError((error as { message?: string })?.message || String(error));
              }
            }}
          >
            Leave Room
          </button>
        </div>
      </div>
    </main>
  );
}
