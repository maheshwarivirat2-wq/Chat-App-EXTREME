'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    router.replace('/rooms');
    router.refresh();
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName } }
    });

    setLoading(false);

    if (signupError) {
      setError(signupError.message);
      return;
    }

    setMessage('Account created. You can now login.');
    router.refresh();
  };

  return (
    <main data-theme="dracula" className="min-h-screen bg-base-300 px-4 py-8">
      <div className="mx-auto flex min-h-[85vh] max-w-4xl items-center justify-center">
        <div className="card w-full max-w-md border border-base-content/20 bg-base-200/70 shadow-2xl backdrop-blur-md">
          <div className="card-body gap-5">
            <div className="space-y-2">
              <h1 className="card-title text-2xl">Welcome back</h1>
              <p className="text-sm text-base-content/70">Private space for your friend group.</p>
            </div>

            <div className="tabs tabs-boxed grid w-full grid-cols-2">
              <button className={`tab ${mode === 'login' ? 'tab-active' : ''}`} onClick={() => setMode('login')}>
                Login
              </button>
              <button className={`tab ${mode === 'signup' ? 'tab-active' : ''}`} onClick={() => setMode('signup')}>
                Sign Up
              </button>
            </div>

            {mode === 'login' ? (
              <form className="space-y-4" onSubmit={handleLogin}>
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">Email</span>
                  </div>
                  <input
                    className="input input-bordered w-full"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </label>

                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">Password</span>
                  </div>
                  <input
                    className="input input-bordered w-full"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </label>

                {error ? <div className="alert alert-error text-sm">{error}</div> : null}
                {message ? <div className="alert alert-success text-sm">{message}</div> : null}

                <button className="btn btn-primary w-full" type="submit" disabled={loading}>
                  {loading ? 'Signing in...' : 'Continue with Email'}
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleSignup}>
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">Display Name</span>
                  </div>
                  <input
                    className="input input-bordered w-full"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </label>

                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">Email</span>
                  </div>
                  <input
                    className="input input-bordered w-full"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </label>

                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">Password</span>
                  </div>
                  <input
                    className="input input-bordered w-full"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                  />
                </label>

                {error ? <div className="alert alert-error text-sm">{error}</div> : null}
                {message ? <div className="alert alert-success text-sm">{message}</div> : null}

                <button className="btn btn-primary w-full" type="submit" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
