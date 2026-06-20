// app/actions/quizzes.ts
'use server';

import db from '@/lib/db';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function createQuiz(data: {
  title: string;
  description: string;
  domain: string;
  questions: { text: string; options: string[]; answer: string }[];
}) {
  const session = await auth();
  const user = session?.user as any;

  if (!user?.id) {
    throw new Error("Unauthorized. Please log in first.");
  }

  // Create the Quiz and its nested Questions in a single transaction
  const quiz = await db.quiz.create({
    data: {
      title: data.title.trim(),
      description: data.description.trim(),
      domain: data.domain,
      questions: {
        create: data.questions.map((q) => ({
          text: q.text.trim(),
          options: q.options,
          answer: q.answer.trim(),
        })),
      },
    },
  });

  revalidatePath('/arena/quiz');
  return quiz;
}