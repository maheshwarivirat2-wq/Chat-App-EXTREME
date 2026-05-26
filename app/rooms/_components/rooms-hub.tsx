'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { usePresenceStore } from '@/stores/presence-store';
import { RoomSummary, useRoomsStore } from '@/stores/rooms-store';

type RoomsHubProps = {
  email?: string;
  initialRooms: RoomSummary[];
};

export function RoomsHub({ email, initialRooms }: RoomsHubProps) {
  const { rooms, setRooms, addRoom } = useRoomsStore();
  const { upsertPresence } = usePresenceStore();
  const { setUserFullName } = useAuthStore();
  const supabase = useMemo(() => createClient(), []);
  const [showModal, setShowModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [customStatus, setCustomStatus] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus('Unable to save status. Please sign in again.');
      return;
    }

    const nowIso = new Date().toISOString();
    const nextStatus = customStatus.trim();
    const nextFullName = fullName.trim();

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: nextFullName.length ? nextFullName : null })
      .eq('id', user.id);

    if (profileError) {
      setStatus(profileError.message);
      return;
    }

    const { error } = await supabase.from('presence_state').upsert({
      user_id: user.id,
      is_online: true,
      custom_status: nextStatus.length ? nextStatus : null,
      last_seen_at: nowIso
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setUserFullName(nextFullName.length ? nextFullName : null);
    upsertPresence({
      userId: user.id,
      isOnline: true,
      customStatus: nextStatus.length ? nextStatus : null,
      lastSeenAt: nowIso
    });

    setShowProfileModal(false);
    setStatus('Profile and global status updated.');
  };

  useEffect(() => setRooms(initialRooms), [initialRooms, setRooms]);

  const sortedRooms = useMemo(
    () => [...rooms].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [rooms]
  );

  useEffect(() => {
    if (!showProfileModal) return;

    const loadProfile = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) return;

      const [{ data: profile }, { data: presence }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
        supabase.from('presence_state').select('custom_status').eq('user_id', user.id).maybeSingle()
      ]);

      setFullName(profile?.full_name ?? '');
      setCustomStatus(presence?.custom_status ?? '');
    };

    void loadProfile();
  }, [showProfileModal, supabase]);

  const createRoom = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/rooms', { method: 'POST', body: JSON.stringify({ name: newRoomName }) });
    const payload = await response.json();
    if (!response.ok) return setStatus(payload.error ?? 'Failed to create room.');
    addRoom({
      ...payload.room,
      lastReadAt: null,
      latestMessageCreatedAt: null,
      hasUnread: false
    });
    setNewRoomName('');
    setShowModal(false);
    setStatus(`Created ${payload.room.name} (${payload.room.code}).`);
  };

  const joinRoom = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/rooms/join', { method: 'POST', body: JSON.stringify({ code: joinCode }) });
    const payload = await response.json();
    if (!response.ok) return setStatus(payload.error ?? 'Failed to join room.');
    addRoom({
      ...payload.room,
      lastReadAt: null,
      latestMessageCreatedAt: null,
      hasUnread: false
    });
    setJoinCode('');
    setStatus(`Joined ${payload.room.name} (${payload.room.code}).`);
  };

  return (
    <main className="min-h-screen bg-obsidian px-4 py-8">
      <section className="mx-auto max-w-5xl space-y-6">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Room Hub</h1>
              <p className="mt-1 text-sm text-textMuted">Signed in as {email}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                aria-label="Open profile and status"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold uppercase text-white transition hover:bg-white/20"
                onClick={() => setShowProfileModal(true)}
                type="button"
              >
                {email?.[0] ?? 'U'}
              </button>
              <button className="glass rounded-xl px-4 py-2 text-sm hover:bg-surface" onClick={() => setShowModal(true)}>
                + Create Room
              </button>
            </div>
          </div>
          <form className="mt-4 flex gap-3" onSubmit={joinRoom}>
            <input
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 uppercase tracking-[0.2em] text-black placeholder-gray-500 outline-none"
              maxLength={6}
              placeholder="Enter 6-char room code"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            />
            <button className="rounded-xl border border-violet-400/40 bg-violet-500/20 px-4 py-2 text-sm">Join</button>
          </form>
          {status ? <p className="mt-3 text-sm text-textMuted">{status}</p> : null}
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Your Rooms</h2>
          <ul className="mt-4 space-y-3">
            {sortedRooms.map((room) => (
              <li key={room.id}>
                <Link
                  className="block rounded-xl border border-gray-200 bg-white p-4 transition hover:border-indigo-300 hover:bg-indigo-50/70"
                  href={`/rooms/${room.id}?name=${encodeURIComponent(room.name)}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-gray-900">{room.name}</p>
                    {room.hasUnread ? <span className="h-3 w-3 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.95)] animate-pulse" /> : null}
                  </div>
                  <p className="mt-1 text-xs text-gray-700">Code: {room.code}</p>
                </Link>
              </li>
            ))}
            {!sortedRooms.length ? <li className="text-sm text-textMuted">No rooms joined yet.</li> : null}
          </ul>
        </div>
      </section>

      {showModal ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 p-4">
          <form className="glass w-full max-w-md rounded-2xl p-6" onSubmit={createRoom}>
            <h3 className="text-lg font-semibold">Create a new room</h3>
            <input
              className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-black placeholder-gray-500 outline-none"
              maxLength={60}
              placeholder="Room name"
              value={newRoomName}
              onChange={(event) => setNewRoomName(event.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-xl px-4 py-2 text-sm text-textMuted" type="button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="rounded-xl border border-cyan-400/40 bg-cyan-500/20 px-4 py-2 text-sm">Create</button>
            </div>
          </form>
        </div>
      ) : null}

      {showProfileModal ? (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <form
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F19]/90 p-6 backdrop-blur-md"
            onSubmit={saveProfile}
          >
            <h3 className="text-lg font-semibold">Profile &amp; Status</h3>
            <p className="mt-1 text-sm text-textMuted">{email ?? 'Signed-in user'}</p>
            <input
              className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-black placeholder-gray-500 outline-none"
              maxLength={80}
              placeholder="Your name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
            <input
              className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-black placeholder-gray-500 outline-none"
              maxLength={120}
              placeholder="Set a custom status"
              value={customStatus}
              onChange={(event) => setCustomStatus(event.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-xl px-4 py-2 text-sm text-textMuted" type="button" onClick={() => setShowProfileModal(false)}>
                Cancel
              </button>
              <button className="rounded-xl border border-cyan-400/40 bg-cyan-500/20 px-4 py-2 text-sm" type="submit">
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
