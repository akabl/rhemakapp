// app/(dashboard)/arena/quiz/[quizId]/QuizPlayerClient.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Question {
  id: string;
  text: string;
  options: string[];
  answer: string;
}

interface QuizPlayerClientProps {
  quiz: {
    id: string;
    title: string;
    description: string;
    questions: Question[];
  };
}

export default function QuizPlayerClient({ quiz }: QuizPlayerClientProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  const questions = quiz.questions;
  const activeQuestion = questions[activeIdx];

  const handleSelectOption = (option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [activeQuestion.id]: option,
    }));
  };

  const handleNext = () => {
    if (activeIdx < questions.length - 1) {
      setActiveIdx(activeIdx + 1);
    } else {
      // Evaluate results on match completion
      let correctCount = 0;
      for (const q of questions) {
        if (selectedAnswers[q.id] === q.answer) {
          correctCount++;
        }
      }
      setScore(correctCount);
      setIsFinished(true);
    }
  };

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 text-center space-y-6">
          <div className="space-y-2">
            <span className="text-4xl">🏆</span>
            <h1 className="text-2xl font-bold text-slate-100">Quiz Completed!</h1>
            <p className="text-sm text-slate-400">
              Review your results and details for the challenge below.
            </p>
          </div>

          <div className="py-4 px-6 bg-slate-950 rounded-xl border border-slate-850 inline-block">
            <span className="text-xs text-slate-500 uppercase block font-semibold select-none">Final Score</span>
            <span className="text-2xl font-extrabold text-purple-400">
              {score} / {questions.length}
            </span>
          </div>

          <div className="space-y-4 text-left border-t border-slate-850 pt-6">
            <h3 className="font-bold text-slate-200 text-sm select-none">Question Review:</h3>
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const userAns = selectedAnswers[q.id];
                const isCorrect = userAns === q.answer;
                return (
                  <div key={q.id} className="p-4 bg-slate-950/40 border border-slate-855 rounded-lg space-y-2">
                    <p className="text-sm font-semibold text-slate-200">{idx + 1}. {q.text}</p>
                    <div className="text-xs space-y-1">
                      <p className="text-slate-400">Your Answer: <strong className={isCorrect ? 'text-emerald-400' : 'text-red-400'}>{userAns || 'None Selected'}</strong></p>
                      {!isCorrect && (
                        <p className="text-slate-500">Correct Answer: <strong className="text-emerald-400">{q.answer}</strong></p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center gap-3 border-t border-slate-850 pt-6">
            <Link 
              href="/arena/quiz" 
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-lg transition"
            >
              Exit to Lobby
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        {/* Header Question progress bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-850 pb-3 select-none">
          <span>Rhemaka Quiz Challenge</span>
          <span>Question {activeIdx + 1} of {questions.length}</span>
        </div>

        {/* Progress Bar indicator */}
        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850/50">
          <div 
            className="bg-purple-600 h-full transition-all duration-300"
            style={{ width: `${((activeIdx + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Active Question Title */}
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-bold text-slate-100 leading-snug">
            {activeQuestion.text}
          </h2>
        </div>

        {/* Options List Choices */}
        <div className="space-y-2 pt-2">
          {activeQuestion.options.map((option) => {
            const isSelected = selectedAnswers[activeQuestion.id] === option;
            return (
              <button
                key={option}
                onClick={() => handleSelectOption(option)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition select-none flex items-center justify-between ${
                  isSelected 
                    ? 'bg-purple-950/40 border-purple-600 text-purple-200 font-semibold' 
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span>{option}</span>
                {isSelected && <span className="text-purple-400">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end border-t border-slate-850 pt-6">
          <button
            onClick={handleNext}
            disabled={!selectedAnswers[activeQuestion.id]}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-sm rounded-lg transition shadow-md cursor-pointer"
          >
            {activeIdx < questions.length - 1 ? 'Next Question →' : 'Finish Quiz ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}