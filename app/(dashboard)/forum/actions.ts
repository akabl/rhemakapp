// app/(dashboard)/forum/actions.ts
'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth'; // Fetch active session

// Action 1: Create and save a comment inside Supabase
export async function createComment(postId: string, content: string) {
  if (!content || content.trim() === '') return;

  // Retrieve current active user session
  const session = await auth();
  const user = session?.user as any;
  
  if (!user?.id) {
    throw new Error("You must be logged in to reply to questions.");
  }

  await db.comment.create({
    data: {
      content: content.trim(),
      postId: postId,
      authorId: user.id, // Linked to the authenticated logged-in user
    },
  });

  // Clear cache and reload the forum page to display the new comment
  revalidatePath(`/forum/${postId}`);
}

// Action 2: Create and save a new post (question) inside Supabase
export async function createPost(title: string, content: string, tagsString: string) {
  if (!title || !content) return;

  const session = await auth();
  const user = session?.user as any;

  if (!user?.id) {
    throw new Error("You must be logged in to publish questions.");
  }

  const tags = tagsString
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);

  const newPost = await db.post.create({
    data: {
      title: title.trim(),
      content: content.trim(),
      tags: tags,
      authorId: user.id,
    },
  });

  revalidatePath('/forum');

  return newPost.id;
}