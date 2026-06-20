"use client";

import { useChat } from "@/context/ChatContext";
import MessageList from "@/components/(chat)/message-list";
import ChatInput from "@/components/(chat)/chat-input";
import { useSession } from "next-auth/react";

export default function ChatPage() {
  const { data: session } = useSession();
  const { messages, activeRecipient, sendMessage, currentUserId } = useChat();

  const user = session?.user as any;
  const currentUsername = user?.username || user?.name || '';

  const handleSendMessage = (text: string) => {
    if (currentUserId) {
      sendMessage(text, currentUserId, currentUsername);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto border border-slate-800 rounded-xl bg-slate-900 overflow-hidden">
      <header className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">
          {activeRecipient ? `Chat with ${activeRecipient.username}` : 'Rhema Chat'}
        </h1>
        {activeRecipient && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-400">Live</span>
          </div>
        )}
      </header>

      <MessageList messages={messages} currentUserId={currentUserId} />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}