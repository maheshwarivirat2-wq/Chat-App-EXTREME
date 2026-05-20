'use client';

import { useMemo, useState } from 'react';

type Room = {
  id: string;
  name: string;
  code: string;
  theme_key: 'neo-violet' | 'neo-cyan';
  owner_id: string;
  created_at: string;
};

export function RoomsShell({ initialRooms }: { initialRooms: Room[] }) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const orderedRooms = useMemo(
    () => [...rooms].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [rooms]
  );

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setMessage(null);
    const res = await fetch('/api/rooms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const payload = await res.json();
    setCreating(false);
    if (!res.ok) return setError(payload.error ?? 'Failed to create room.');
    setRooms((prev) => [payload.room, ...prev.filter((r) => r.id !== payload.room.id)]);
    setName('');
    setMessage(`Room created: ${payload.room.name} (${payload.room.code})`);
  };

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    setError(null);
    setMessage(null);
    const res = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    const payload = await res.json();
    setJoining(false);
    if (!res.ok) return setError(payload.error ?? 'Failed to join room.');

    const exists = rooms.some((r) => r.id === payload.room.id);
    if (!exists) {
      setRooms((prev) => [{ ...payload.room, created_at: new Date().toISOString(), theme_key: 'neo-violet', owner_id: '' }, ...prev]);
    }
    setCode('');
    setMessage(`Joined room: ${payload.room.name} (${payload.room.code})`);
  };

  return (
    <main className="min-h-screen bg-obsidian px-4 py-6">
      <div className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-[320px_1fr]">
        <aside className="glass rounded-2xl p-4">
          <h2 className="text-lg font-semibold">Your Rooms</h2>
          <p className="mt-1 text-xs text-textMuted">Private code-based rooms</p>
          <div className="mt-4 space-y-2">
            {orderedRooms.length === 0 ? (
              <p className="text-sm text-textMuted">No rooms yet. Create or join one.</p>
            ) : (
              orderedRooms.map((room) => (
                <div key={room.id} className="rounded-xl border border-borderSoft bg-white/5 px-3 py-2">
                  <p className="font-medium text-textPrimary">{room.name}</p>
                  <p className="text-xs text-textMuted">Code: {room.code}</p>
                </div>
              ))
            )}
          </div>
        </aside>

        <section className="space-y-4">
          <div className="glass rounded-2xl p-4">
            <h3 className="text-lg font-semibold">Create Room</h3>
            <form className="mt-3 space-y-3" onSubmit={createRoom}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Room name"
                maxLength={60}
                className="w-full rounded-xl border border-borderSoft bg-white/5 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-accentViolet/50"
              />
              <button className="rounded-xl bg-accentViolet px-4 py-2 text-sm font-semibold" disabled={creating}>
                {creating ? 'Creating...' : 'Create room'}
              </button>
            </form>
          </div>

          <div className="glass rounded-2xl p-4">
            <h3 className="text-lg font-semibold">Join Room</h3>
            <form className="mt-3 space-y-3" onSubmit={joinRoom}>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-char code"
                maxLength={6}
                className="w-full rounded-xl border border-borderSoft bg-white/5 px-3 py-2.5 text-sm uppercase tracking-widest outline-none focus:ring-1 focus:ring-accentViolet/50"
              />
              <button className="rounded-xl bg-accentViolet px-4 py-2 text-sm font-semibold" disabled={joining}>
                {joining ? 'Joining...' : 'Join room'}
              </button>
            </form>
          </div>

          {(error || message) && (
            <div className={`rounded-xl border px-3 py-2 text-sm ${error ? 'border-rose-400/30 text-rose-300' : 'border-emerald-400/30 text-emerald-300'}`}>
              {error ?? message}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
