// app/(dashboard)/arena/quiz/[quizId]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import db from '@/lib/db';
import QuizPlayerClient from './QuizPlayerClient';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ quizId: string }>;
}

export default async function QuizPlayPage({ params }: PageProps) {
  // 1. Verify user authentication session
  const session = await auth();
  const user = session?.user as any;

  if (!user?.id) {
    redirect('/login');
  }

  // 2. Await dynamic parameters
  const { quizId } = await params;

  // 3. Query the quiz and its nested questions using the exact schema fields
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        select: {
          id: true,
          text: true,      // Select correct schema field
          options: true,   // Select correct schema field
          answer: true,    // Select correct schema field
        },
        orderBy: {
          id: 'asc'        // Order consistently by unique CUID
        }
      }
    }
  });

  // Handle non-existent quiz IDs with a standard 404 handler
  if (!quiz) {
    notFound();
  }

  // 4. Adapt database rows cleanly to match our client player interface
  const adaptedQuiz = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options,
      answer: q.answer
    }))
  };

  return (
    <div className="space-y-6">
      <Link 
        href="/arena/quiz" 
        className="text-sm font-medium text-slate-400 hover:text-blue-400 transition inline-flex items-center gap-2 group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Quiz Lobby
      </Link>
      
      <QuizPlayerClient quiz={adaptedQuiz} />
    </div>
  );
}