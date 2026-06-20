// app/(dashboard)/arena/page.tsx
import Link from 'next/link';

const ARENA_CHALLENGES = [
  {
    id: 'chess',
    title: 'Chess & Checkers',
    description: 'Play standard chess or checkers matches. Fully validated rules, moves tracking, and global leaderboards.',
    link: '/arena/chess',
    status: 'Live',
    color: 'from-amber-600 to-amber-700',
  },
  {
    id: 'coding',
    title: 'Coding Arena',
    description: 'Engage in algorithmic duels and debugging speed races. Compete against others or collaborate in real-time.',
    link: '/arena/coding',
    status: 'Live',
    color: 'from-blue-600 to-blue-700',
  },
  {
    id: 'quiz',
    title: 'Quiz Challenge',
    description: 'Test your knowledge across mathematics, science, algorithms, and music theory in timed multiple-choice battles.',
    link: '/arena/quiz',
    status: 'Live',
    color: 'from-purple-600 to-purple-700',
  },
];

export default function ArenaLobbyPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Challenge Arena</h1>
        <p className="text-sm text-slate-400 mt-1">
          Select a discipline, challenge other minds, and climb the competitive domain ranks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ARENA_CHALLENGES.map((challenge) => (
          <div 
            key={challenge.id} 
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition duration-200"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-100">{challenge.title}</h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold select-none ${
                  challenge.status === 'Live' 
                    ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-400' 
                    : 'bg-slate-950/60 border border-slate-850 text-slate-500'
                }`}>
                  {challenge.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {challenge.description}
              </p>
            </div>

            {challenge.status === 'Live' ? (
              <Link 
                href={challenge.link}
                className={`w-full py-2.5 rounded-lg text-center font-semibold text-sm bg-gradient-to-r ${challenge.color} hover:brightness-110 text-white transition block shadow-md`}
              >
                Join Arena
              </Link>
            ) : (
              <button 
                disabled
                className="w-full py-2.5 rounded-lg text-center font-semibold text-sm bg-slate-800/50 text-slate-600 border border-slate-850/30 cursor-not-allowed block"
              >
                Locked
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}