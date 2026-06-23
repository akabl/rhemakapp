// app/(dashboard)/settings/password/page.tsx
'use client';

import { useState, useTransition } from 'react';
import { changePassword } from '@/app/actions/password';
import Link from 'next/link';

export default function ChangePasswordPage() {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPass !== confirmPass) {
      setError("New passwords do not match.");
      return;
    }

    startTransition(async () => {
      const result = await changePassword({ currentPass, newPass, confirmPass });

      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess("✓ Your password has been successfully updated!");
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      }
    });
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Link href="/forum" className="text-sm font-medium text-slate-400 hover:text-blue-400 transition">
        ← Back to Forum
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Change Password</h1>
          <p className="text-sm text-slate-400 mt-1">Update your Rhemaka account security credentials.</p>
        </div>

        {success && (
          <div className="p-3 bg-green-950/50 border border-green-800 rounded-lg text-xs text-green-300">
            {success}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-300">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Current Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition text-slate-100"
              disabled={isPending}
            />
          </div>

          <div className="border-t border-slate-850 pt-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition text-slate-100"
                disabled={isPending}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition text-slate-100"
                disabled={isPending}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold text-sm rounded-lg transition mt-2 shadow-md cursor-pointer"
          >
            {isPending ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}