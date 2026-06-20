// components/chat/ChatPanel.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@/context/ChatContext';

interface ChatPanelProps {
  currentUserId: string;
  currentUsername: string;
}

export default function ChatPanel({ currentUserId, currentUsername }: ChatPanelProps) {
  const { isOpen, activeRecipient, messages, closeChat, sendMessage } = useChat();
  const [text, setText] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll list to bottom on new message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen || !activeRecipient) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    sendMessage(text, currentUserId, currentUsername);
    setText('');
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col transition-all duration-300">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-bold text-slate-100 text-sm">
            Chat with {activeRecipient.username}
          </h3>
        </div>
        <button 
          onClick={closeChat}
          className="text-slate-400 hover:text-slate-200 text-lg p-1.5 hover:bg-slate-800 rounded-lg transition"
        >
          ✕
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length > 0 ? (
          messages.map((msg, index) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div 
                key={index} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p>{msg.content}</p>
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        ) : (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-xs text-slate-500 max-w-[200px]">
              This is the beginning of your conversation with {activeRecipient.username}.
            </p>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Footer Form Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-950/35">
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Message ${activeRecipient.username}...`}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}