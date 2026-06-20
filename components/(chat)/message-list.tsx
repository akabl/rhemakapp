"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/context/ChatContext";

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
}

export default function MessageList({ messages, currentUserId }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, index) => {
        const isMe = msg.senderId === currentUserId;
        return (
          <div
            key={index}
            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                isMe
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-slate-800 text-slate-200 rounded-tl-none"
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <span className="text-[10px] opacity-70 block mt-1">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}