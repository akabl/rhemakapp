// app/(auth)/forgot-password/page.tsx
'use client';

import { useState, useTransition } from 'react';
import { sendPasswordResetRequest } from '@/app/actions/password';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [devToken, setDevToken] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDevToken('');

    startTransition(async () => {
      const result = await sendPasswordResetRequest(email);

      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess('✓ If this email matches an active account, a password reset link has been dispatched.');
        if (result?.devToken) {
          setDevToken(result.devToken); // Captures token locally for on-screen clicking in development mode
        }
      }
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Forgot Password?</h1>
          <p className="text-sm text-slate-400 mt-1">Enter your email and we'll dispatch a secure recovery token.</p>
        </div>

        {success && (
          <div className="space-y-4">
            <div className="p-3 bg-green-950/50 border border-green-800 rounded-lg text-xs text-green-300">
              {success}
            </div>
            
            {/* Dev Mode Shortcut: Allows clicking the link directly rather than scanning terminal logs */}
            {devToken && (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Local Dev Shortcut</span>
                <Link 
                  href={`/reset-password?token=${devToken}`} 
                  className="text-xs text-blue-400 hover:text-blue-300 hover:underline font-semibold block"
                >
                  Click here to proceed to Reset Page →
                </Link>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-300">
            ⚠ {error}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold text-sm rounded-lg transition mt-2 shadow-md cursor-pointer"
            >
              {isPending ? 'Processing...' : 'Send Recovery Link'}
            </button>
          </form>
        )}

        <p className="text-xs text-center text-slate-500">
          Remembered your credentials?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </main>
  );
}