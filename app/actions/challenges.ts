// app/actions/challenges.ts
'use server';

import db from '@/lib/db';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

// Action to allow an administrator to save a new challenge to Supabase
export async function createChallenge(data: {
  title: string;
  difficulty: string;
  description: string;
  templates: any;
  testCases: any;
}) {
  const session = await auth();
  const user = session?.user as any;

  // In production, you would check if user.role === 'admin'
  if (!user?.id) {
    throw new Error("Unauthorized. Please log in first.");
  }

  const challenge = await db.challenge.create({
    data: {
      title: data.title.trim(),
      difficulty: data.difficulty,
      description: data.description.trim(),
      templates: data.templates,
      testCases: data.testCases,
    },
  });

  // Revalidate the cache so the arena has instant access to the new challenge
  revalidatePath('/arena/coding');
  return challenge;
}