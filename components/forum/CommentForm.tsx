// components/forum/CommentForm.tsx
'use client';

import { useState, useTransition } from 'react';
import { createComment } from '@/app/(dashboard)/forum/actions';

interface CommentFormProps {
  postId: string;
}

export default function CommentForm({ postId }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    // Trigger the Server Action in a transition wrapper to manage loading states
    startTransition(async () => {
      try {
        await createComment(postId, content);
        setContent(''); // Reset textarea upon successful post
      } catch (error) {
        console.error("Failed to post comment:", error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="comment" className="block text-sm font-semibold text-slate-300 mb-2">
          Join the discussion
        </label>
        <textarea
          id="comment"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your reply... (supports standard spacing)"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none leading-relaxed"
          disabled={isPending}
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-sm rounded-lg transition shadow-md"
        >
          {isPending ? 'Posting Reply...' : 'Post Reply'}
        </button>
      </div>
    </form>
  );
}