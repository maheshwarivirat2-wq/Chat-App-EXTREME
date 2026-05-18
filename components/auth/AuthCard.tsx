'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { AuthTabs } from './AuthTabs';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

export function AuthCard() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <GlassCard className="w-full max-w-md p-6 shadow-glow">
      <div className="mb-6 space-y-3">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-textMuted">Private space for your friend group.</p>
        <AuthTabs mode={mode} onChange={setMode} />
      </div>
      {mode === 'login' ? <LoginForm /> : <SignupForm />}
    </GlassCard>
  );
}
