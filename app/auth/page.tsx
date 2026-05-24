import { AuthCard } from '@/components/auth/AuthCard';

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-[#0B0F19] px-4 py-10 sm:py-14">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <AuthCard />
      </div>
    </main>
  );
}
