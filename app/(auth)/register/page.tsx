// app/(auth)/register/page.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/app/actions/auth';
import { Eye, EyeOff } from 'lucide-react'; // Import Lucide icons
import Link from 'next/link';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Track independent visibility toggles for password and confirmation fields
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Evaluate password rules in real-time as the user types
  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password), // Checks for any non-alphanumeric character
  };

  const isPasswordValid = Object.values(rules).every((ruleMet) => ruleMet);
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';
  const isFormValid = isPasswordValid && passwordsMatch && username.trim() !== '' && email.trim() !== '';

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isFormValid) {
      setError("Please ensure all security requirements are met and passwords match.");
      return;
    }

    startTransition(async () => {
      const result = await registerUser(username, email, password);
      
      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/login?registered=true'); // Redirect on success
      }
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-center">Create Your Rhemaka Account</h1>
          <p className="text-sm text-slate-400 text-center mt-1">Connect, compete, and collaborate across disciplines.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-300">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5 select-none">Username</label>
            <input
              type="text"
              required
              placeholder="e.g., AliceCoder"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition text-slate-100"
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5 select-none">Email Address</label>
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
            <label className="block text-sm font-semibold text-slate-300 mb-1.5 select-none">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} // Toggle input type dynamically
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 pr-10 text-sm focus:outline-none focus:border-blue-500 transition text-slate-100"
                disabled={isPending}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
                disabled={isPending}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Real-Time Password Strength Checklist Panel */}
            {password.length > 0 && (
              <div className="mt-3 space-y-1.5 bg-slate-950 p-3 rounded-lg border border-slate-850 text-xs text-slate-400">
                <p className="font-semibold text-slate-300 mb-1 text-[10px] uppercase tracking-wider select-none">
                  Security Checklist:
                </p>
                
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${rules.length ? "text-emerald-400 font-bold" : "text-slate-600"}`}>
                    {rules.length ? "✓" : "•"}
                  </span>
                  <span className={rules.length ? "text-slate-300" : "text-slate-500"}>Minimum 8 characters</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-sm ${rules.uppercase ? "text-emerald-400 font-bold" : "text-slate-600"}`}>
                    {rules.uppercase ? "✓" : "•"}
                  </span>
                  <span className={rules.uppercase ? "text-slate-300" : "text-slate-500"}>At least one uppercase letter (A-Z)</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-sm ${rules.lowercase ? "text-emerald-400 font-bold" : "text-slate-600"}`}>
                    {rules.lowercase ? "✓" : "•"}
                  </span>
                  <span className={rules.lowercase ? "text-slate-300" : "text-slate-500"}>At least one lowercase letter (a-z)</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-sm ${rules.number ? "text-emerald-400 font-bold" : "text-slate-600"}`}>
                    {rules.number ? "✓" : "•"}
                  </span>
                  <span className={rules.number ? "text-slate-300" : "text-slate-500"}>At least one numerical digit (0-9)</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-sm ${rules.special ? "text-emerald-400 font-bold" : "text-slate-600"}`}>
                    {rules.special ? "✓" : "•"}
                  </span>
                  <span className={rules.special ? "text-slate-300" : "text-slate-500"}>At least one special character (@, #, !, etc.)</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5 select-none">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"} // Toggle type dynamically
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full bg-slate-950 border rounded-lg p-3 pr-10 text-sm focus:outline-none transition text-slate-100 ${
                  confirmPassword.length > 0
                    ? passwordsMatch
                      ? 'border-emerald-800 focus:border-emerald-600'
                      : 'border-red-900 focus:border-red-700'
                    : 'border-slate-800 focus:border-blue-500'
                }`}
                disabled={isPending}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
                disabled={isPending}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {confirmPassword.length > 0 && !passwordsMatch && (
              <span className="text-[10px] text-red-400 mt-1 block px-1">
                Passwords do not match.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending || !isFormValid}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-850 disabled:text-slate-600 disabled:border-slate-900 border border-transparent text-white font-semibold text-sm rounded-lg transition mt-2 shadow-md cursor-pointer select-none"
          >
            {isPending ? 'Registering...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-xs text-center text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </main>
  );
}