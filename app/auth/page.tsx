import { AuthCard } from '@/components/auth/AuthCard';

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-obsidian px-4 py-8">
      <div className="mx-auto flex min-h-[85vh] max-w-4xl items-center justify-center">
        <AuthCard />
      </div>
    </main>
  );
}
