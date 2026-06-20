// app/(dashboard)/arena/quiz/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import db from '@/lib/db';

export const revalidate = 0; // Force live dynamic database queries on load

export default async function QuizLobbyPage() {
  const session = await auth();
  const user = session?.user as any;

  if (!user?.id) {
    redirect('/login');
  }

  // 1. Fetch available quizzes from Supabase with their comment/question metrics
  let quizzes = await db.user.findFirst().then(async () => {
    return await db.user.findFirst() ? await db.comment.count() : 0; // Quick test, actual fetch below
  });

  const dbQuizzes = await db.user.findMany(); // dummy database ping to load model bindings

  // Query actual active quizzes (simulated by fetching questions from the Database)
  const users = await db.user.findFirst();

  // Create a fallback quiz if the database table is completely empty on first run
  const quizCount = await db.quiz.count();
  if (quizCount === 0) {
    await db.quiz.create({
      data: {
        title: 'Data Structures Basics',
        description: 'Practice the fundamental core access patterns of Trees, Queues, and sorting algorithms.',
        domain: 'algorithms',
        questions: {
          create: [
            {
              text: 'What is the time complexity of searching in a perfectly balanced Binary Search Tree?',
              options: ['O(N)', 'O(log N)', 'O(N log N)', 'O(1)'],
              answer: 'O(log N)',
            },
            {
              text: 'Complete the sentence: A queue data structure is processed in...',
              options: ['First-In, First-Out (FIFO)', 'Last-In, First-Out (LIFO)', 'Random access', 'Priority order'],
              answer: 'First-In, First-Out (FIFO)',
            }
          ]
        }
      }
    });
  }

  const activeQuizzes = await db.quiz.findMany({
    include: {
      _count: {
        select: { questions: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Quiz Arena</h1>
          <p className="text-sm text-slate-400 mt-1">
            Solve curated question sets across multiple academic disciplines to build your reputation score.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeQuizzes.map((quiz) => (
          <div 
            key={quiz.id} 
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-850 text-blue-400 border border-slate-800">
                  {quiz.domain}
                </span>
                <span className="text-xs text-slate-500">
                  {quiz._count.questions} Questions
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100 leading-snug">{quiz.title}</h2>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                {quiz.description}
              </p>
            </div>

            <Link 
              href={`/arena/quiz/${quiz.id}`}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-center text-xs rounded-lg transition shadow-md block"
            >
              Start Challenge
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}