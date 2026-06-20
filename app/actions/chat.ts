// app/actions/chat.ts
'use server';

import db from '@/lib/db';
import { auth } from '@/auth';

// Action 1: Fetch message logs between the active user and another user
export async function getChatHistory(otherUserId: string) {
  const session = await auth();
  const user = session?.user as any;
  if (!user?.id) throw new Error("Unauthorized");

  return await db.message.findMany({
    where: {
      OR: [
        { senderId: user.id, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: user.id }
      ]
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      id: true,
      content: true,
      senderId: true,
      createdAt: true,
      sender: {
        select: { username: true }
      }
    }
  });
}

// Action 2: Save a new message record inside Supabase
export async function saveMessageToDb(recipientId: string, content: string) {
  const session = await auth();
  const user = session?.user as any;
  if (!user?.id) throw new Error("Unauthorized");

  return await db.message.create({
    data: {
      content: content.trim(),
      senderId: user.id,
      recipientId
    }
  });
}