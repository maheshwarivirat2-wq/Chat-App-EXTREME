'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { RoomSummary, useRoomsStore } from '@/stores/rooms-store';

type RoomsHubProps = {
  email?: string;
  initialRooms: RoomSummary[];
};

export function RoomsHub({ email, initialRooms }: RoomsHubProps) {
  const { rooms, setRooms, addRoom } = useRoomsStore();
  const [showModal, setShowModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => setRooms(initialRooms), [initialRooms, setRooms]);

  const sortedRooms = useMemo(
    () => [...rooms].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [rooms]
  );

  const createRoom = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/rooms', { method: 'POST', body: JSON.stringify({ name: newRoomName }) });
    const payload = await response.json();
    if (!response.ok) return setStatus(payload.error ?? 'Failed to create room.');
    addRoom(payload.room);
    setNewRoomName('');
    setShowModal(false);
    setStatus(`Created ${payload.room.name} (${payload.room.code}).`);
  };

  const joinRoom = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/rooms/join', { method: 'POST', body: JSON.stringify({ code: joinCode }) });
    const payload = await response.json();
    if (!response.ok) return setStatus(payload.error ?? 'Failed to join room.');
    addRoom(payload.room);
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
            <button className="glass rounded-xl px-4 py-2 text-sm hover:bg-surface" onClick={() => setShowModal(true)}>
              + Create Room
            </button>
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
                  <p className="font-medium text-gray-900">{room.name}</p>
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
    </main>
  );
}
