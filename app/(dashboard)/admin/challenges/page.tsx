// app/(dashboard)/admin/challenges/page.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createChallenge } from '@/app/actions/challenges';
import Link from 'next/link';

export default function AdminChallengesPage() {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [description, setDescription] = useState('');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    // Pre-packaged test configurations for an automated runtime evaluation
    const defaultTemplates = {
      javascript: `function solve(s) {\n  // Task: Reverse the input string 's' and return it\n  return s.split('').reverse().join('');\n}`,
      python: `def solve(s):\n    # Task: Reverse the input string 's' and return it\n    return s[::-1]`,
      java: `public class Solution {\n    public static String solve(String s) {\n        return new StringBuilder(s).reverse().toString();\n    }\n}`,
      cpp: `#include <string>\n#include <algorithm>\nusing namespace std;\nstring solve(string s) {\n    reverse(s.begin(), s.end());\n    return s;\n}`,
      sql: `SELECT username FROM "User";`,
      php: `<?php\nfunction solve($s) {\n    return strrev($s);\n}\n?>`
    };

    const defaultTestCases = [
      { input: ["hello"], expected: "olleh" },
      { input: ["Rhemaka"], expected: "akamehR" }
    ];

    startTransition(async () => {
      try {
        await createChallenge({
          title,
          difficulty,
          description,
          templates: defaultTemplates,
          testCases: defaultTestCases,
        });

        setMessage('✓ Challenge published successfully to Supabase!');
        setTitle('');
        setDescription('');
        router.refresh();
      } catch (err: any) {
        setMessage(`Error: ${err.message || err}`);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/arena" className="text-sm font-medium text-slate-400 hover:text-blue-400 transition">
        ← Back to Arena
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Challenge Creator Panel</h1>
          <p className="text-sm text-slate-400 mt-1">
            As an Administrator, you can publish algorithmic tasks directly to the Coding Arena database.
          </p>
        </div>

        {message && (
          <div className="p-3 bg-blue-950/40 border border-blue-800 rounded-lg text-xs text-blue-300">
            {message}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Challenge Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Reverse a String"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-lg p-3 focus:outline-none focus:border-blue-500 transition"
              disabled={isPending}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Task Description</label>
            <textarea
              rows={6}
              required
              placeholder="Explain the inputs, expected outputs, and constraints..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition resize-none"
              disabled={isPending}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold text-sm rounded-lg transition mt-2 shadow-md cursor-pointer"
          >
            {isPending ? 'Publishing to Database...' : 'Publish Challenge'}
          </button>
        </form>
      </div>
    </div>
  );
}