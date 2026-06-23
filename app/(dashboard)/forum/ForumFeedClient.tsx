// app/(dashboard)/forum/ForumFeedClient.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import PostCard, { Post } from '@/components/forum/PostCard';

const PILLARS = [
  { name: 'All Topics', value: 'all' },
  { name: 'Mathematics', value: 'mathematics' },
  { name: 'Algorithms', value: 'algorithms' },
  { name: 'Coding', value: 'coding' },
  { name: 'Chess & Checkers', value: 'chess' },
  { name: 'Music Theory', value: 'music' },
  { name: 'Sciences', value: 'science' },
];

interface LeaderboardUser {
  id: string;
  username: string;
  quizScore: number;
}

interface ForumFeedClientProps {
  initialPosts: Post[];
  quizLeaderboard: LeaderboardUser[]; // Added quizLeaderboard prop
}

export default function ForumFeedClient({ initialPosts, quizLeaderboard }: ForumFeedClientProps) {
  const [selectedPillar, setSelectedPillar] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering filter logic for live database posts
  const filteredPosts = initialPosts.filter((post) => {
    const matchesPillar = selectedPillar === 'all' || post.tags.includes(selectedPillar);
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPillar && matchesSearch;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar: Filters, Leaderboards, & Actions */}
      <aside className="lg:col-span-1 space-y-6">
        
        {/* Card 1: Pillars of Knowledge */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
            Pillars of Knowledge
          </h2>
          <div className="space-y-1">
            {PILLARS.map((pillar) => (
              <button
                key={pillar.value}
                onClick={() => setSelectedPillar(pillar.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  selectedPillar === pillar.value
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {pillar.name}
              </button>
            ))}
          </div>
        </div>

        {/* Card 2: Quiz Leaderboard (New Section!) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 border-b border-slate-850 pb-2">
            Quiz Leaderboard
          </h2>
          
          <div className="space-y-2">
            {quizLeaderboard && quizLeaderboard.length > 0 ? (
              quizLeaderboard.map((player, index) => {
                const isTopThree = index < 3;
                const medalColors = ["text-amber-400", "text-slate-300", "text-amber-700"];
                
                return (
                  <div 
                    key={player.id} 
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-950/20 border border-slate-850/40 hover:border-slate-800 transition"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {/* Rank Indicator */}
                      <span className={`text-xs font-bold w-4 text-center ${isTopThree ? medalColors[index] : 'text-slate-500'}`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                      </span>
                      
                      {/* Clickable Username linking to their dashboard profile */}
                      <Link 
                        href={`/profile/${player.username}`}
                        className="text-xs font-bold text-slate-300 hover:text-blue-400 hover:underline truncate transition"
                      >
                        {player.username}
                      </Link>
                    </div>

                    {/* Quiz Cumulative Score */}
                    <span className="text-[10px] font-bold text-purple-400 px-2 py-0.5 rounded bg-purple-950/20 border border-purple-900/30 font-mono">
                      {player.quizScore} pts
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">No quiz scores recorded yet.</p>
            )}
          </div>
        </div>

        {/* Card 3: Arena Promotion */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
          <h3 className="font-semibold text-slate-200 mb-2">Ready to test your ideas?</h3>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Move directly from discussion threads to real-time coding duels, quiz shows, or chess matches.
          </p>
          <Link 
            href="/arena" 
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-lg transition shadow-md block text-center"
          >
            Enter Arena Lobby
          </Link>
        </div>
      </aside>

      {/* Main Forum Post Feed */}
      <main className="lg:col-span-3 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="relative w-full sm:w-96">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search posts or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <Link 
            href="/forum/new" 
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition shadow-md text-center inline-block"
          >
            + Ask a Question
          </Link>
        </div>

        {/* Feed list rendering */}
        <div className="space-y-4">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
              <span className="text-3xl">📭</span>
              <h3 className="text-lg font-semibold text-slate-300 mt-3">No topics match</h3>
              <p className="text-sm text-slate-500 mt-1">
                Be the first to start a discussion under this pillar!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}