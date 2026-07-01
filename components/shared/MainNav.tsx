// components/shared/MainNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { name: 'Forum', href: '/forum' },
  { name: 'Arena', href: '/arena' },
  { name: 'Chat', href: '/chat' }
];

interface MainNavProps {
  isLoggedIn: boolean;
}

export function MainNav({ isLoggedIn }: MainNavProps) {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-6">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`text-sm transition-all duration-150 px-3 py-1.5 rounded-xl select-none ${
              isActive
                ? 'bg-blue-600/10 text-blue-400 border border-blue-900/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 font-medium hover:bg-slate-900/40'
            }`}
          >
            {item.name}
          </Link>
        );
      })}

      {/* Admin Dropdown menu (active when logged in) */}
      {isLoggedIn && (
        <div className="relative group flex items-center gap-1.5 cursor-pointer text-sm font-medium text-slate-400 hover:text-blue-400 transition h-16">
          <span className={pathname.startsWith('/admin') ? 'text-blue-400 font-bold' : ''}>
            Admin
          </span>
          <span className={`text-[9px] ${pathname.startsWith('/admin') ? 'text-blue-400' : 'text-slate-500'}`}>
            ▼
          </span>
          
          {/* Dropdown Options List */}
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
  );
}