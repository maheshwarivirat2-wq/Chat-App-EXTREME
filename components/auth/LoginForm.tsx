'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TextField } from '@/components/ui/TextField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.replace('/rooms');
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <TextField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
      <TextField label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
      {error && <StatusMessage error message={error} />}
      <PrimaryButton type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Continue with Email'}</PrimaryButton>
    </form>
  );
}
