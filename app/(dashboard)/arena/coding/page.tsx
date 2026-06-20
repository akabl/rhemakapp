// app/(dashboard)/arena/coding/page.tsx
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import db from '@/lib/db';
import CodingArenaClient from './CodingArenaClient';

export const revalidate = 0; // Force database dynamic queries on load

export default async function CodingArenaPage() {
  const session = await auth();
  const user = session?.user as any;

  if (!user?.id) {
    redirect('/login');
  }

  // Fetch the list of live, admin-created challenges from your Supabase database
  let databaseChallenges = await db.challenge.findMany({
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Fallback: If no challenges have been created by an admin yet,
  // we will auto-seed and display a default task so the UI does not break on first load.
  if (databaseChallenges.length === 0) {
    const defaultTask = await db.challenge.create({
      data: {
        title: 'Sum of Two Integers',
        difficulty: 'Easy',
        description: 'Complete the function to calculate and return the sum of variables a and b.',
        templates: {
          javascript: `function solve(a, b) {\n  // Write your code here\n  return a + b;\n}`,
          python: `def solve(a, b):\n    # Write your code here\n    return a + b`,
          java: `public class Solution {\n    public static int solve(int a, int b) {\n        return a + b;\n    }\n}`,
          cpp: `int solve(int a, int b) {\n    return a + b;\n}`,
          sql: `SELECT id, username, reputation FROM "User" WHERE reputation > 10;`,
          php: `<?php\nfunction solve($a, $b) {\n    return $a + $b;\n}\n?>`
        },
        testCases: [
          { input: [5, 7], expected: 12 },
          { input: [-3, 8], expected: 5 }
        ],
      },
    });
    databaseChallenges = [defaultTask];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Coding Arena</h1>
        <p className="text-sm text-slate-400 mt-1">
          Write elegant code, test algorithms, and compete or collaborate in real-time.
        </p>
      </div>

      <CodingArenaClient 
        currentUserId={user.id} 
        currentUsername={user.username || user.name || ''} 
        initialChallenges={databaseChallenges} 
      />
    </div>
  );
}