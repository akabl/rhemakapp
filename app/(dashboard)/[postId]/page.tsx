// app/(dashboard)/forum/[postId]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import db from '@/lib/db';
import CommentForm from '@/components/forum/CommentForm';

interface PageProps {
  params: Promise<{ postId: string }>;
}

export default async function PostDetailPage({ params }: PageProps) {
  // 1. Await dynamic parameters (required in modern Next.js routes)
  const { postId } = await params;

  // 2. Fetch the post, its author, and its comments directly from Supabase
  const post = await db.post.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: { username: true, reputation: true },
      },
      comments: {
        include: {
          author: {
            select: { username: true },
          },
        },
        orderBy: {
          createdAt: 'asc', // Show comments chronologically
        },
      },
    },
  });

  // Handle non-existent post IDs with a standard Next.js 404 handler
  if (!post) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back to feed button */}
      <Link 
        href="/forum" 
        className="text-sm font-medium text-slate-400 hover:text-blue-400 transition inline-flex items-center gap-2 group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Forum
      </Link>

      {/* Main Post Card */}
      <article className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700 uppercase">
              {post.author.username[0]}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                {post.author.username}
                <span className="text-[10px] bg-slate-850 px-2 py-0.5 rounded text-blue-400 font-normal border border-slate-800">
                  ★ {post.author.reputation} rep
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Posted on {post.createdAt.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span 
                key={tag} 
                className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/50"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Post Title and Content */}
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight leading-snug">
            {post.title}
          </h1>
          <p className="text-slate-300 text-base leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>
      </article>

      {/* Dynamic Comments List */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2">
          Discussion ({post.comments.length})
        </h2>

        {post.comments.length > 0 ? (
          <div className="space-y-4">
            {post.comments.map((comment) => (
              <div 
                key={comment.id} 
                className="bg-slate-900/60 border border-slate-850 rounded-xl p-5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    {comment.author.username}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {comment.createdAt.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
            <p className="text-sm text-slate-500">No replies yet. Be the first to start the discussion!</p>
          </div>
        )}

        {/* Input Form Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <CommentForm postId={postId} />
        </div>
      </div>
    </div>
  );
}