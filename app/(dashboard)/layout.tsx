// app/(dashboard)/layout.tsx
import Link from 'next/link';
import { auth, signOut } from '@/auth'; // Fetch active session and mount the signOut action
import { SocketProvider } from '../hooks/useSockects'; // Path matching your app/hooks/useSockets.tsx setup
import { ChatProvider } from '@/context/ChatContext';
import ChatPanel from '../../components/(chat)/ChatPanel';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  // Cast the user object as 'any' so TypeScript allows reading custom fields like id and username
  const user = session?.user as any;
  const currentUserId = user?.id;
  const currentUsername = user?.username || user?.name || '';

  return (
    <SocketProvider>
      <ChatProvider currentUserId={currentUserId}>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
          {/* Global Navigation Header */}
          <header className="border-b border-slate-850 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <Link href="/" className="text-xl font-bold tracking-wider text-blue-500">
                  Rhemaka
                </Link>
                <nav className="hidden md:flex items-center gap-6">
                  <Link href="/forum" className="text-sm font-medium text-slate-400 hover:text-blue-300 transition">
                    Forum
                  </Link>
                  <Link href="/arena" className="text-sm font-medium hover:text-blue-400 transition">
                    Arena
                  </Link>
                  <Link href="/chat" className="text-sm font-medium hover:text-blue-400 transition">
                    Chat
                  </Link>
                  
                  {/* Hover Dropdown: Appears only when user is logged in */}
                  {session?.user && (
                    <div className="relative group flex items-center gap-1.5 cursor-pointer text-sm font-medium text-slate-400 hover:text-blue-400 transition h-16">
                      <span>Admin</span>
                      <span className="text-[9px]">▼</span>
                      
                      {/* Dropdown Menu Container (Triggered purely via CSS hover) */}
                      <div className="absolute top-full left-0 mt-0.5 hidden group-hover:block bg-slate-900 border border-slate-800 rounded-xl p-2 w-44 shadow-2xl z-50">
                        <Link 
                          href="/admin/challenges" 
                          className="block px-3 py-2 rounded-lg text-xs hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition text-left"
                        >
                          Coding Challenges
                        </Link>
                        <Link 
                          href="/admin/quizzes" 
                          className="block px-3 py-2 rounded-lg text-xs hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition text-left"
                        >
                          Quiz Challenges
                        </Link>
                      </div>
                    </div>
                  )}
                </nav>
              </div>
              
              <div className="flex items-center gap-4">
                {session?.user ? (
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      Logged in as <strong className="text-slate-200">{currentUsername}</strong>
                    </span>
                    
                    {/* Log Out Form using server-only signOut Action */}
                    <form
                      action={async () => {
                        'use server';
                        await signOut({ redirectTo: "/" }); // Clears session and redirects to homepage
                      }}
                    >
                      <button 
                        type="submit" 
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 hover:text-red-400 transition cursor-pointer"
                      >
                        Log Out
                      </button>
                    </form>
                  </div>
                ) : (
                  <Link href="/login" className="text-xs text-blue-400 hover:underline">
                    Log In
                  </Link>
                )}

                {/* Clickable Name/Avatar Icon linking directly to their dashboard profile */}
                {session?.user ? (
                  <Link href={`/profile/${currentUsername}`}>
                    <div className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center font-bold text-sm text-white uppercase select-none cursor-pointer">
                      {currentUsername ? currentUsername[0] : 'U'}
                    </div>
                  </Link>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white uppercase select-none">
                    U
                  </div>
                )}
              </div>
            </div>
          </header>
          
          {/* Dashboard Container page content */}
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
            {children}
          </div>

          {/* Mount the Global Real-Time Chat Panel Overlay */}
          {currentUserId && (
            <ChatPanel currentUserId={currentUserId} currentUsername={currentUsername} />
          )}
        </div>
      </ChatProvider>
    </SocketProvider>
  );
}