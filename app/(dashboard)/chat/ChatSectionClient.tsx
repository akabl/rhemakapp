// app/(dashboard)/chat/ChatSectionClient.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../hooks/useSockects'; // Adjust path if hooks is inside app/
import { getChatHistory, saveMessageToDb } from '@/app/actions/chat';

interface UserItem {
  id: string;
  username: string;
  reputation: number;
}

interface ChatSectionClientProps {
  currentUserId: string;
  currentUsername: string;
  usersList: UserItem[];
}

export default function ChatSectionClient({ 
  currentUserId, 
  currentUsername, 
  usersList 
}: ChatSectionClientProps) {
  const { socket, isConnected } = useSocket();
  const [activeUser, setActiveUser] = useState<UserItem | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // 1. Join personal Socket.io room on layout mount
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('join_room', currentUserId);
    }
  }, [socket, isConnected, currentUserId]);

  // 2. Fetch messages from database when selected user changes
  useEffect(() => {
    if (!activeUser) return;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const history = await getChatHistory(activeUser.id);
        setMessages(history);
      } catch (error) {
        console.error("Failed to load chat history:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [activeUser]);

  // 3. Listen for live incoming messages over WebSockets
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleReceiveMessage = (msg: any) => {
      // Append the message if it is part of the open conversation
      if (
        (msg.senderId === activeUser?.id && msg.recipientId === currentUserId) ||
        (msg.senderId === currentUserId && msg.recipientId === activeUser?.id)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, isConnected, activeUser, currentUserId]);

  // 4. Scroll to bottom on new message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeUser || !socket) return;

    const messageContent = text.trim();
    setText('');

    try {
      // A. Write to database (Supabase)
      await saveMessageToDb(activeUser.id, messageContent);

      // B. Broadcast to Socket Server
      socket.emit('send_message', {
        recipientId: activeUser.id,
        senderId: currentUserId,
        senderName: currentUsername,
        content: messageContent,
      });
    } catch (err) {
      console.error("Failed to transmit message:", err);
    }
  };

  return (
    <div className="h-[calc(100vh-180px)] min-h-[450px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-4">
      
      {/* 1. Left Column: Users List */}
      <aside className="md:col-span-1 border-r border-slate-800 bg-slate-950/30 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-400">Users</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {usersList.length > 0 ? (
            usersList.map((user) => (
              <button
                key={user.id}
                onClick={() => setActiveUser(user)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between ${
                  activeUser?.id === user.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="truncate pr-2">
                  <span className="text-sm truncate block">{user.username}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  activeUser?.id === user.id 
                    ? 'bg-blue-700 text-white' 
                    : 'bg-slate-900 text-slate-500'
                }`}>
                  ★ {user.reputation}
                </span>
              </button>
            ))
          ) : (
            <p className="text-xs text-slate-600 text-center py-6">No other users found.</p>
          )}
        </div>
      </aside>

      {/* 2. Right Column: Conversation Window */}
      <main className="md:col-span-3 flex flex-col bg-slate-900">
        {activeUser ? (
          <>
            {/* Chat Area Header */}
            <header className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
              <span className="font-bold text-slate-200 text-sm">
                Conversation with {activeUser.username}
              </span>
              <span className="text-xs text-slate-500">
                Connection: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </span>
            </header>

            {/* Live Message History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Loading conversation history...
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg, index) => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <div 
                      key={msg.id || index} 
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div 
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
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
                    No message history. Write your first message to {activeUser.username} below.
                  </p>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Input Submission Footer */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-950/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`Send message to ${activeUser.username}...`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  disabled={!isConnected}
                />
                <button
                  type="submit"
                  disabled={!text.trim() || !isConnected}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            Select a user from the sidebar directory to begin chatting.
          </div>
        )}
      </main>
    </div>
  );
}