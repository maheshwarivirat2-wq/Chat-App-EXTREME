'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TextField } from '@/components/ui/TextField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { StatusMessage } from '@/components/ui/StatusMessage';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName } }
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage('Account created. You can now login.');
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <TextField label="Display Name" type="text" value={displayName} onChange={setDisplayName} placeholder="Your name" />
      <TextField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
      <TextField label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" />
      {error && <StatusMessage error message={error} />}
      {message && <StatusMessage message={message} />}
      <PrimaryButton type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</PrimaryButton>
    </form>
  );
}
