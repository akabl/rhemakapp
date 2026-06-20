// app/(dashboard)/forum/new/page.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPost } from '@/app/(dashboard)/forum/actions';
import Link from 'next/link';

export default function NewPostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    startTransition(async () => {
      try {
        const newPostId = await createPost(title, content, tags);
        if (newPostId) {
          router.push(`/forum/${newPostId}`);
        }
      } catch (error) {
        console.error("Failed to create post:", error);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link 
        href="/forum" 
        className="text-sm font-medium text-slate-400 hover:text-blue-400 transition inline-flex items-center gap-2 group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Forum
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Ask a Question</h1>
          <p className="text-sm text-slate-400 mt-1">
            Share your curiosities with the Rhemaka community.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
              Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g., What's the most intuitive explanation of Euler's formula?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
              Describe your question
            </label>
            <textarea
              rows={8}
              required
              placeholder="Explain what you are trying to understand, solve, or prove..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none leading-relaxed"
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
              Tags
            </label>
            <input
              type="text"
              placeholder="e.g., mathematics, algorithms, music-theory (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              disabled={isPending}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Link
              href="/forum"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending || !title.trim() || !content.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-sm rounded-lg transition shadow-md"
            >
              {isPending ? 'Publishing...' : 'Publish Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}