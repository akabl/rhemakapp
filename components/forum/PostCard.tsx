// components/forum/PostCard.tsx
import Link from 'next/link';
import { useChat } from '@/context/ChatContext';

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  authorId: string; // Added authorId to support the hook trigger
  author: string;
  createdAt: string;
  upvotes: number;
  commentsCount: number;
}

export default function PostCard({ post }: { post: Post }) {
  const { openChat } = useChat();

  return (
    <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex gap-4">
      {/* Upvote side panel */}
      <div className="flex flex-col items-center justify-start gap-1 text-slate-400 bg-slate-950/40 p-2 rounded-lg h-fit min-w-[40px]">
        <button className="hover:text-blue-500 transition text-lg" aria-label="Upvote">▲</button>
        <span className="text-sm font-semibold">{post.upvotes}</span>
        <button className="hover:text-red-500 transition text-lg" aria-label="Downvote">▼</button>
      </div>

      {/* Main card content */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {/* Clickable author name to open the chat drawer */}
            <button 
              onClick={() => openChat(post.authorId, post.author)}
              className="text-xs text-slate-400 hover:text-blue-400 hover:underline font-semibold transition"
            >
              Posted by {post.author}
            </button>
            <span className="text-xs text-slate-600">•</span>
            <span className="text-xs text-slate-500">{post.createdAt}</span>
          </div>
          <Link href={`/forum/${post.id}`} className="group">
            <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition mb-2">
              {post.title}
            </h3>
          </Link>
          <p className="text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {post.excerpt}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50">
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

          <Link 
            href={`/forum/${post.id}`} 
            className="text-xs text-slate-400 hover:text-blue-400 transition flex items-center gap-1.5"
          >
            💬 {post.commentsCount} comments
          </Link>
        </div>
      </div>
    </div>
  );
}