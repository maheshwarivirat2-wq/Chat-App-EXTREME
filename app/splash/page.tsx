'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SplashScreen } from '@/components/splash/SplashScreen';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';

export default function SplashPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const setSplashDone = useUiStore((s) => s.setSplashDone);

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();

      setSession(session);
      setSplashDone(true);

      setTimeout(() => {
        router.replace(session ? '/rooms' : '/auth');
      }, 1400);
    };

    void run();
  }, [router, setSession, setSplashDone]);

  return <SplashScreen />;
}
