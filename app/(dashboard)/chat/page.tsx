// app/(dashboard)/chat/page.tsx
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import db from '@/lib/db';
import ChatSectionClient from './ChatSectionClient';

export const revalidate = 0; // Force dynamic rendering on load

export default async function ChatPage() {
  const session = await auth();
  const user = session?.user as any;

  // Protect route and redirect guests to login
  if (!user?.id) {
    redirect('/login');
  }

  // Fetch all other users in Rhemaka so they can select them to chat
  const otherUsers = await db.user.findMany({
    where: {
      id: { not: user.id } // Exclude the active logged-in user
    },
    select: {
      id: true,
      username: true,
      reputation: true
    },
    orderBy: {
      username: 'asc'
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Direct Messages</h1>
        <p className="text-sm text-slate-400 mt-1">
          Chat securely with other players and academics across the Rhemaka network.
        </p>
      </div>

      <ChatSectionClient 
        currentUserId={user.id} 
        currentUsername={user.username || user.name || ''} 
        usersList={otherUsers} 
      />
    </div>
  );
}