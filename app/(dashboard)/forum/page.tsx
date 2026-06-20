// app/(dashboard)/forum/page.tsx
import db from '@/lib/db';
import ForumFeedClient from './ForumFeedClient';
import { Post } from '@/components/forum/PostCard';

// Opt out of static page rendering to ensure database queries happen dynamically in real-time
export const revalidate = 0;

export default async function ForumPage() {
  // 1. Fetch posts directly from Supabase with relational authors and comment counts
  const databasePosts = await db.post.findMany({
    include: {
      author: {
        select: {
          username: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc', // Show newest first
    },
  });

  // 2. Map database structures to fit the layout-friendly Post interface
  const formattedPosts: Post[] = databasePosts.map((post) => ({
    id: post.id,
    title: post.title,
    excerpt: post.content, // Using content body as excerpt
    tags: post.tags,
    authorId: post.authorId, // Maps the specific ID so the chat drawer knows who to open a session with
    author: post.author.username,
    createdAt: post.createdAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    upvotes: post.upvotes,
    commentsCount: post._count.comments,
  }));

  // 3. Render the client-side search and filtering using the fetched data
  return <ForumFeedClient initialPosts={formattedPosts} />;
}