// app/page.tsx
import Link from 'next/link';
import Image from 'next/image'; // Import the Next.js optimized Image component
import { auth } from '@/auth';

export default async function Home() {
  // Check if there is an active logged-in user session on server load
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-950 text-white">
      <div className="text-center max-w-xl flex flex-col items-center">
        
        {/* Logo Container: Adjust width (w-64) and height (h-24) to fit your image ratios */}
        <div className="relative w-64 h-24 mb-6">
          <Image
            src="/logo.png" // Refers directly to public/logo.png
            alt="Rhemaka Logo"
            fill
            priority // Preloads the logo immediately for better user experience
            className="object-contain" // Preserves your image's aspect ratio without stretching
          />
        </div>
        
        <p className="text-slate-400 text-lg mb-8 leading-relaxed">
          Nexus for Tech Passion.
        </p>
        <div className="flex justify-center gap-4">
          <Link 
            href={isLoggedIn ? "/forum" : "/login"} 
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold transition text-center min-w-[140px]"
          >
            Explore Forum
          </Link>
          <Link 
            href={isLoggedIn ? "/arena" : "/login"} 
            className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold transition text-center min-w-[140px]"
          >
            Enter Arena
          </Link>
        </div>
      </div>
    </main>
  );
}