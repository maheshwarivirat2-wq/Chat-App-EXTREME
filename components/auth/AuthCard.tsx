'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { AuthTabs } from './AuthTabs';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

export function AuthCard() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <GlassCard className="w-full max-w-md border border-white/10 p-7 shadow-glow sm:p-8">
      <div className="mb-7 space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome back</h1>
        <p className="text-sm leading-relaxed text-textMuted">Private space for your friend group.</p>
        <AuthTabs mode={mode} onChange={setMode} />
      </div>
      {mode === 'login' ? <LoginForm /> : <SignupForm />}
    </GlassCard>
  );
}
