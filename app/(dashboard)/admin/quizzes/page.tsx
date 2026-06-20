// app/(dashboard)/admin/quizzes/page.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createQuiz } from '@/app/actions/quizzes';
import Link from 'next/link';

interface QuestionInput {
  text: string;
  options: string[];
  answer: string;
}

export default function AdminQuizzesPage() {
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('algorithms');
  const [description, setDescription] = useState('');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Dynamic state list to manage editable questions
  const [questions, setQuestions] = useState<QuestionInput[]>([
    { text: '', options: ['', '', '', ''], answer: '' }
  ]);

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { text: '', options: ['', '', '', ''], answer: '' }
    ]);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    if (questions.length === 1) return; // Maintain at least one question
    setQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
  };

  const handleQuestionTextChange = (qIndex: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === qIndex ? { ...q, text: val } : q))
    );
  };

  const handleOptionChange = (qIndex: number, oIndex: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIndex) return q;
        const newOptions = [...q.options];
        newOptions[oIndex] = val;
        return { ...q, options: newOptions };
      })
    );
  };

  const handleAnswerSelect = (qIndex: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === qIndex ? { ...q, answer: val } : q))
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    // Pre-submission validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setMessage(`Error: Question ${i + 1} text cannot be empty.`);
        return;
      }
      if (q.options.some(opt => !opt.trim())) {
        setMessage(`Error: All options in Question ${i + 1} must be filled out.`);
        return;
      }
      if (!q.answer) {
        setMessage(`Error: Please select the correct answer for Question ${i + 1}.`);
        return;
      }
    }

    startTransition(async () => {
      try {
        await createQuiz({
          title,
          description,
          domain,
          questions,
        });

        setMessage(`✓ Quiz successfully published with ${questions.length} questions to Supabase!`);
        setTitle('');
        setDescription('');
        setQuestions([{ text: '', options: ['', '', '', ''], answer: '' }]); // Reset
        router.refresh();
      } catch (err: any) {
        setMessage(`Error: ${err.message || err}`);
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 mb-12">
      <Link href="/arena" className="text-sm font-medium text-slate-400 hover:text-blue-400 transition">
        ← Back to Arena
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Quiz Creator Panel</h1>
          <p className="text-sm text-slate-400 mt-1">
            As an Administrator, you can build and publish fully custom multiple-choice quizzes to the Arena.
          </p>
        </div>

        {message && (
          <div className="p-3 bg-blue-950/40 border border-blue-800 rounded-lg text-xs text-blue-300">
            {message}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Main Quiz Metadata */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Quiz Title</label>
              <input
                type="text"
                required
                placeholder="e.g., Data Structures Basics"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
                disabled={isPending}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Pillar / Domain</label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-lg p-3 focus:outline-none focus:border-blue-500 transition"
                  disabled={isPending}
                >
                  <option value="mathematics">Mathematics</option>
                  <option value="algorithms">Algorithms</option>
                  <option value="science">Sciences</option>
                  <option value="music">Music Theory</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Quiz Description</label>
                <input
                  type="text"
                  required
                  placeholder="Summarize the topics covered..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          {/* Dynamic Question Builder Section */}
          <div className="border-t border-slate-800 pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-200">Quiz Questions ({questions.length})</h2>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
                disabled={isPending}
              >
                + Add Question
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((question, qIdx) => (
                <div 
                  key={qIdx} 
                  className="p-5 bg-slate-950/40 border border-slate-855 rounded-xl space-y-4 relative"
                >
                  {/* Remove Question button */}
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="absolute top-4 right-4 text-xs text-red-500 hover:text-red-400 font-semibold cursor-pointer"
                      disabled={isPending}
                    >
                      Remove
                    </button>
                  )}

                  <span className="text-[10px] font-bold text-slate-500 uppercase block select-none">
                    Question {qIdx + 1}
                  </span>

                  {/* Question Text */}
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Type your question here..."
                      value={question.text}
                      onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition"
                      disabled={isPending}
                    />
                  </div>

                  {/* 4 Choices options inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {question.options.map((option, idx) => ( // Named the index variable 'idx'
                      <div key={idx} className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase px-1">
                          Option {idxToLetter(idx)}
                        </span>
                        <input
                          type="text"
                          required
                          placeholder={`Choice Option ${idxToLetter(idx)}`}
                          value={question.options[idx] || ''}
                          onChange={(e) => handleOptionChange(qIdx, idx, e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition"
                          disabled={isPending}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Correct Answer Selector */}
                  <div className="space-y-1.5 md:w-1/2 pt-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Select Correct Answer
                    </label>
                    <select
                      value={question.answer}
                      onChange={(e) => handleAnswerSelect(qIdx, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg p-2 focus:outline-none focus:border-blue-500 transition"
                      disabled={isPending}
                    >
                      <option value="">-- Choose correct option --</option>
                      {question.options.map((opt, oIdx) => (
                        <option key={oIdx} value={opt} disabled={!opt.trim()}>
                          {opt.trim() ? `${String.fromCharCode(65 + oIdx)}: ${opt.trim()}` : `Option ${String.fromCharCode(65 + oIdx)} (empty)`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold text-sm rounded-lg transition mt-2 shadow-md cursor-pointer"
          >
            {isPending ? 'Publishing Quiz...' : 'Publish Quiz'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Helper to convert array index to letter
function idxToLetter(index: number): string {
  return String.fromCharCode(65 + index);
}