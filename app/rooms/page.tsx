import { requireAuth } from '@/lib/auth/guards';

export default async function RoomsPage() {
  const { user } = await requireAuth();

  return (
    <main className="min-h-screen bg-obsidian px-4 py-8">
      <div className="glass mx-auto max-w-3xl rounded-2xl p-8">
        <h1 className="text-2xl font-bold">Rooms</h1>
        <p className="mt-2 text-textMuted">Authenticated as {user?.email}</p>
        <p className="mt-4 text-sm text-textMuted">Chat room UI wiring comes next in the following phase.</p>
      </div>
    </main>
  );
}
