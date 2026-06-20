// app/(dashboard)/profile/[username]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import db from '@/lib/db';
import { auth } from '@/auth';
import MessageButton from '@/app/(dashboard)/profile/MessageButton';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  // 1. Await dynamic parameters (standard for Next.js 15+ routing)
  const { username } = await params;

  // 2. Query user data, post counts, and their recent submissions
  const profileUser = await db.user.findUnique({
    where: { username },
    include: {
      _count: {
        select: {
          posts: true,
          comments: true,
        },
      },
      posts: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 5, // Load the 5 most recent forum questions
      },
    },
  });

  // Render a standard 404 page if the username is not found in the database
  if (!profileUser) {
    notFound();
  }

  // Fetch active session user info to prevent rendering self-messaging buttons
  const session = await auth();
  const activeUser = session?.user as any;
  const currentUserId = activeUser?.id;

  // Parse game stats JSON safely or fallback to baseline averages
  const stats = (profileUser.gameStats as any) || {
    chessElo: 1200,
    codingDuels: 0,
    quizScore: 0,
  };

  // Dynamically calculate intellectual/academic badges based on stats
  const badges = [];
  if (profileUser.reputation >= 200) badges.push({ name: 'Elite Scholar', desc: 'Reputation exceeded 200 pts', color: 'bg-indigo-950 border-indigo-700 text-indigo-400' });
  if (stats.chessElo >= 1400) badges.push({ name: 'Chess Tactician', desc: 'Chess ELO exceeded 1400', color: 'bg-amber-950 border-amber-700 text-amber-400' });
  if (profileUser._count.posts >= 5) badges.push({ name: 'Inquisitive Mind', desc: 'Asked 5+ forum questions', color: 'bg-blue-950 border-blue-700 text-blue-400' });
  if (profileUser._count.comments >= 5) badges.push({ name: 'Active Reviewer', desc: 'Replied to 5+ threads', color: 'bg-emerald-950 border-emerald-700 text-emerald-400' });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* 1. Header Profile Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-5 text-center md:text-left">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold text-white border border-blue-500 uppercase shadow-lg">
            {profileUser.username[0]}
          </div>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center md:justify-start">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">{profileUser.username}</h1>
              <span className="text-xs bg-slate-850 px-2.5 py-1 rounded-md text-blue-400 border border-slate-800 font-semibold inline-block w-fit mx-auto sm:mx-0">
                ★ {profileUser.reputation} Reputation
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Member since {profileUser.createdAt.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Messaging button trigger overlay */}
        <MessageButton 
          userId={profileUser.id} 
          username={profileUser.username} 
          currentUserId={currentUserId} 
        />
      </div>

      {/* 2. Content Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Achievements */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Game Stats Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">
              Arena Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/40 border border-slate-850 rounded-lg p-3 text-center">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Chess ELO</span>
                <span className="text-lg font-bold text-amber-500">{stats.chessElo || 1200}</span>
              </div>
              <div className="bg-slate-950/40 border border-slate-850 rounded-lg p-3 text-center">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Duels Won</span>
                <span className="text-lg font-bold text-blue-500">{stats.codingDuels || 0}</span>
              </div>
            </div>
          </div>

          {/* Forum Activity Stats Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">
              Forum Contributions
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Questions Asked</span>
                <span className="font-bold text-slate-200">{profileUser._count.posts}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Replies Posted</span>
                <span className="font-bold text-slate-200">{profileUser._count.comments}</span>
              </div>
            </div>
          </div>

          {/* Academic Badges Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">
              Domain Badges
            </h3>
            {badges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <div 
                    key={badge.name} 
                    title={badge.desc}
                    className={`text-xs px-2.5 py-1 rounded-md border font-bold select-none cursor-help ${badge.color}`}
                  >
                    {badge.name}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-600">No achievements recorded yet. Participate in discussions to earn badges!</p>
            )}
          </div>
        </div>

        {/* Right Column: Forum History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">
              Recent Questions
            </h3>

            {profileUser.posts.length > 0 ? (
              <div className="space-y-4">
                {profileUser.posts.map((post) => (
                  <div 
                    key={post.id} 
                    className="p-4 rounded-lg bg-slate-950/40 border border-slate-850 hover:border-slate-800 transition"
                  >
                    <Link href={`/forum/${post.id}`}>
                      <h4 className="font-semibold text-slate-200 hover:text-blue-400 text-sm md:text-base transition leading-relaxed">
                        {post.title}
                      </h4>
                    </Link>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                      <span>Asked on {post.createdAt.toLocaleDateString()}</span>
                      <span>•</span>
                      <span>▲ {post.upvotes} upvotes</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-950/20 border border-dashed border-slate-850 rounded-lg">
                <p className="text-xs text-slate-500">This user hasn't asked any public forum questions yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}