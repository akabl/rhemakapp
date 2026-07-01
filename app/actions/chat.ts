// app/actions/chat.ts
'use server';

import db from '@/lib/db';
import { auth } from '@/auth';

// Action 1: Fetch message logs (including any nested replies) between two users
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
      replyToId: true,
      sender: {
        select: { username: true }
      },
      // Include the quoted parent message details
      replyTo: {
        select: {
          id: true,
          content: true,
          sender: {
            select: { username: true }
          }
        }
      }
    }
  });
}

// Action 2: Save a new message record (optionally linking a parent reply ID)
export async function saveMessageToDb(recipientId: string, content: string, replyToId?: string) {
  const session = await auth();
  const user = session?.user as any;
  if (!user?.id) throw new Error("Unauthorized");

  return await db.message.create({
    data: {
      content: content.trim(),
      senderId: user.id,
      recipientId,
      replyToId: replyToId || null // Explicitly links the parent message if present
    }
  });
}