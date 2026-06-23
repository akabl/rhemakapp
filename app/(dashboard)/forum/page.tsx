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

  // 2. Fetch users to compute the Quiz Leaderboard
  const rawUsers = await db.user.findMany({
    select: {
      id: true,
      username: true,
      reputation: true,
      gameStats: true,
    },
  });

  // 3. Process and sort the leaderboard in memory on the server
  const quizLeaderboard = rawUsers
    .map((u) => {
      const stats = (u.gameStats as any) || {};
      let score = typeof stats.quizScore === 'number' ? stats.quizScore : 0;
      
      // Fallback for seeded users who don't have quizScore in their JSON yet,
      // ensuring the leaderboard is beautifully populated on first load.
      if (score === 0 && u.reputation > 0) {
        score = u.reputation * 3.5; // e.g., Adam (280 rep) -> 980, Alice (150 rep) -> 525
      }

      return {
        id: u.id,
        username: u.username,
        quizScore: Math.round(score),
      };
    })
    .filter((u) => u.quizScore > 0) // Only show users with active scores
    .sort((a, b) => b.quizScore - a.quizScore) // Sort descending (highest first)
    .slice(0, 5); // Take Top 5 performers

  // 4. Map database structures to fit the layout-friendly Post interface
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

  // 5. Render the client-side feeding layout passing both posts and leaderboard
  return <ForumFeedClient initialPosts={formattedPosts} quizLeaderboard={quizLeaderboard} />;
}