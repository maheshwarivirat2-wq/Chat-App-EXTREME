'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type RoomRow = {
  id: string;
  name: string;
  code: string;
  theme_key: 'neo-violet' | 'neo-cyan' | null;
};

type MemberRow = {
  user_id: string;
  profiles:
    | {
        full_name: string | null;
        email: string | null;
      }
    | {
        full_name: string | null;
        email: string | null;
      }[]
    | null;
};

type PresenceRow = {
  user_id: string;
  is_online: boolean | null;
  custom_status: string | null;
};

type MergedMember = {
  id: string;
  fullName: string;
  email: string;
  status: string;
};

const THEMES = ['neo-violet', 'neo-cyan'] as const;

const getInitials = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) return '?';
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
};

export default function RoomSettingsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const roomId = params.id;
  const supabase = useMemo(() => createClient(), []);

  const [room, setRoom] = useState<RoomRow | null>(null);
  const [members, setMembers] = useState<MergedMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [saveThemeError, setSaveThemeError] = useState<string | null>(null);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setPageError(null);
        const {
          data: { user }
        } = await supabase.auth.getUser();
        setCurrentUserId(user?.id ?? null);

        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('id, name, code, theme_key')
          .eq('id', roomId)
          .maybeSingle();

        if (roomError) {
          throw roomError;
        }

        if (!roomData) {
          throw new Error('Room not found.');
        }

        setRoom(roomData as RoomRow);

        const [membersResult, presenceResult] = await Promise.all([
          supabase.from('room_members').select('user_id, profiles(full_name, email)').eq('room_id', roomId),
          supabase.from('presence_state').select('user_id, is_online, custom_status')
        ]);

        if (membersResult.error) {
          throw membersResult.error;
        }

        if (presenceResult.error) {
          throw presenceResult.error;
        }

        if (!membersResult.data) {
          throw new Error('Unable to load room members.');
        }

        const presenceByUser = new Map<string, string>();
        (presenceResult.data as PresenceRow[] | null)?.forEach((presence) => {
          if (presence.user_id) {
            const customStatus = presence.custom_status?.trim();
            presenceByUser.set(presence.user_id, customStatus || (presence.is_online ? 'online' : 'offline'));
          }
        });

        const mergedMembers: MergedMember[] = (membersResult.data as MemberRow[]).map((member) => {
          const profile = Array.isArray(member.profiles) ? member.profiles[0] ?? null : member.profiles;
          const fullName = profile?.full_name?.trim() || 'Unknown User';
          return {
            id: member.user_id,
            fullName,
            email: profile?.email?.trim() || 'No email',
            status: presenceByUser.get(member.user_id) || 'offline'
          };
        });

        setMembers(mergedMembers);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load room settings.';
        setPageError(message);
      }
    };

    void loadData();
  }, [roomId, supabase]);

  const handleCopyCode = async () => {
    if (!room?.code) return;

    try {
      await navigator.clipboard.writeText(room.code);
      setCopyError(null);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setCopyError('Unable to copy room code. Please copy it manually.');
    }
  };

  const handleThemeChange = async (nextTheme: (typeof THEMES)[number]) => {
    setSaveThemeError(null);
    setPageError(null);

    const previousTheme = room?.theme_key ?? 'neo-violet';
    setRoom((prev) => (prev ? { ...prev, theme_key: nextTheme } : prev));

    try {
      const { error } = await supabase.from('rooms').update({ theme_key: nextTheme }).eq('id', roomId);
      if (error) {
        throw error;
      }
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update room theme.';
      setRoom((prev) => (prev ? { ...prev, theme_key: previousTheme } : prev));
      setSaveThemeError(message);
      setPageError(message);
    }
  };

  const handleLeaveRoom = async () => {
    if (!currentUserId) {
      setLeaveError('Unable to leave room. Please sign in again.');
      return;
    }

    setLeaveError(null);
    setPageError(null);

    try {
      const { error } = await supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', currentUserId);
      if (error) {
        throw error;
      }
      router.push('/rooms');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to leave room.';
      setLeaveError(message);
      setPageError(message);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0F19] text-white">
      {pageError ? (
        <div className="sticky top-0 z-50 border-b-2 border-rose-200 bg-rose-700 px-4 py-3 text-sm font-semibold text-white">
          {pageError}
        </div>
      ) : null}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-[#121826]">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-3 sm:px-4">
          <Link className="rounded-md p-2 text-xl text-slate-200 hover:bg-slate-700/50" href={`/rooms/${roomId}${room?.name ? `?name=${encodeURIComponent(room.name)}` : ''}`}>
            ←
          </Link>
          <h1 className="text-base font-semibold text-slate-100">Room Settings</h1>
          <div className="w-10" />
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-3 py-5 sm:px-4">
        <div className="rounded-2xl border border-slate-800 bg-[#121826] p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Room</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-100">{room?.name ?? 'Loading room...'}</h2>
          <button className="mt-3 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50" type="button" onClick={handleCopyCode}>
            {isCopied ? 'Copied!' : `Code: ${room?.code ?? '...'}`}
          </button>
          {copyError ? <p className="mt-2 text-sm text-rose-300">{copyError}</p> : null}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#121826] p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Theme</p>
          <div className="mt-3 flex gap-2">
            {THEMES.map((themeKey) => (
              <button
                key={themeKey}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  room?.theme_key === themeKey
                    ? 'border-indigo-400 bg-indigo-500/30 text-indigo-100'
                    : 'border-slate-600 text-slate-200 hover:bg-slate-700/50'
                }`}
                type="button"
                onClick={() => handleThemeChange(themeKey)}
              >
                {themeKey}
              </button>
            ))}
          </div>
          {saveThemeError ? <p className="mt-2 text-sm text-rose-300">{saveThemeError}</p> : null}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#121826] p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Members</p>
          <ul className="mt-3 space-y-3">
            {members.map((member) => (
              <li key={member.id} className="flex items-center gap-3 rounded-xl bg-slate-900/60 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/40 text-sm font-semibold text-indigo-100">
                  {getInitials(member.fullName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-100">{member.fullName}</p>
                  <p className="truncate text-xs text-slate-400">{member.email}</p>
                </div>
                <p className="text-xs capitalize text-cyan-300">{member.status}</p>
              </li>
            ))}
          </ul>
        </div>

        <button className="mt-4 rounded-xl border border-rose-500/50 bg-rose-500/20 px-4 py-3 text-sm font-semibold text-rose-200 hover:bg-rose-500/30" type="button" onClick={handleLeaveRoom}>
          Leave Room
        </button>
        {leaveError ? <p className="text-sm text-rose-300">{leaveError}</p> : null}
      </section>
    </main>
  );
}
