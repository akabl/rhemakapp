// app/(auth)/login/page.tsx
'use client';

import { useState, useTransition, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginUser } from '@/app/actions/auth';
import Link from 'next/link';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();

  // Show a message if redirected from a successful registration
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('Account created successfully! Please log in below.');
    }
  }, [searchParams]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    startTransition(async () => {
      const result = await loginUser(email, password);

      // On success, Next.js will automatically redirect them server-side,
      // so we only need to monitor if an error object is returned.
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-center">Log In to Rhemaka</h1>
        <p className="text-sm text-slate-400 text-center mt-1">Unlock your competitive arena feed.</p>
      </div>

      {success && (
        <div className="p-3 bg-green-950/50 border border-green-800 rounded-lg text-xs text-green-300">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-300">
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email Address</label>
          <input
            type="email"
            required
            placeholder="alice@rhemaka.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition text-slate-100"
            disabled={isPending}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1.5">Password</label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition text-slate-100"
            disabled={isPending}
          />
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-blue-400 hover:underline">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold text-sm rounded-lg transition mt-2 shadow-md cursor-pointer"
        >
          {isPending ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p className="text-xs text-center text-slate-500">
        Don't have an account?{' '}
        <Link href="/register" className="text-blue-400 hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      <Suspense fallback={
        <div className="text-xs text-slate-500">Loading auth configurations...</div>
      }>
        <LoginContent />
      </Suspense>
    </main>
  );
}