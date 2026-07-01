// app/(dashboard)/chat/ChatSectionClient.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../hooks/useSockects'; // Path matching singular useSocket.tsx
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
  
  // Local state for the message we are currently quoting/replying to
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  
  // Ref tracking to distinguish initial database history loading from live incoming messages
  const isInitialLoad = useRef(true);
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('join_room', currentUserId);
    }
  }, [socket, isConnected, currentUserId]);

  // Reset the initial load flag whenever we switch to a different conversation
  useEffect(() => {
    isInitialLoad.current = true;
  }, [activeUser]);

  useEffect(() => {
    if (!activeUser) return;

    const loadHistory = async () => {
      setLoading(true);
      setReplyingTo(null); // Clear active reply state when switching users
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

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleReceiveMessage = (msg: any) => {
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

  // --- SMART SCROLL ENGINE ---
  useEffect(() => {
    if (loading) return;

    // Use a tiny microtask timeout (50ms) to ensure Next.js has fully compiled and 
    // painted the message DOM nodes before we calculate the scroll heights.
    const scrollTimer = setTimeout(() => {
      if (isInitialLoad.current) {
        // Snap instantly to the bottom on first load (no slow, jarring scroll-down animation)
        messageEndRef.current?.scrollIntoView({ behavior: 'auto' });
        isInitialLoad.current = false;
      } else {
        // Smoothly scroll down only when a new live message is sent/received
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);

    return () => clearTimeout(scrollTimer);
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeUser || !socket) return;

    const messageContent = text.trim();
    const parentMessageId = replyingTo?.id || null;
    
    // Package replyTo metadata for socket relay
    const replyPayload = replyingTo 
      ? { id: replyingTo.id, content: replyingTo.content, sender: { username: replyingTo.sender?.username || replyingTo.senderName } }
      : null;

    setText('');
    setReplyingTo(null); // Clear reply state immediately on submit

    try {
      // A. Write to database (Supabase) including optional parent ID
      await saveMessageToDb(activeUser.id, messageContent, parentMessageId);

      // B. Broadcast to Socket Server
      socket.emit('send_message', {
        recipientId: activeUser.id,
        senderId: currentUserId,
        senderName: currentUsername,
        content: messageContent,
        replyTo: replyPayload
      });
    } catch (err) {
      console.error("Failed to transmit message:", err);
    }
  };

  return (
    <div className="h-[calc(100vh-180px)] min-h-[450px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-4 animate-fadeIn">
      
      {/* 1. Left Column: Users List */}
      <aside className={`md:col-span-1 border-r border-slate-800 bg-slate-950/30 flex flex-col ${
        activeUser ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-400 select-none">Users</h2>
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
      <main className={`md:col-span-3 flex flex-col bg-slate-900 ${
        activeUser ? 'flex' : 'hidden md:flex'
      }`}>
        {activeUser ? (
          <>
            {/* Chat Area Header */}
            <header className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/20 select-none">
              <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setActiveUser(null)}
                  className="md:hidden text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer font-semibold"
                >
                  ← Users
                </button>
                <span className="font-bold text-slate-200 text-sm">
                  Conversation with {activeUser.username}
                </span>
              </div>
              <span className="text-xs text-slate-500 hidden sm:inline">
                Connection: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </span>
            </header>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs select-none">
                  Loading conversation history...
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg, index) => {
                  const isMe = msg.senderId === currentUserId;
                  const senderName = msg.sender?.username || msg.senderName;
                  
                  return (
                    <div 
                      key={msg.id || index} 
                      className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      {/* Main Message Bubble */}
                      <div 
                        className={`max-w-[75%] rounded-2xl p-1 text-sm leading-relaxed ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-slate-800 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        {/* Nested Quoted Reply block inside message bubble */}
                        {msg.replyTo && (
                          <div className={`text-[10px] rounded-xl p-2.5 mb-1 select-none border ${
                            isMe 
                              ? 'bg-blue-700/60 border-blue-500/30 text-blue-100' 
                              : 'bg-slate-950/40 border-slate-850 text-slate-400'
                          }`}>
                            <strong className="text-blue-400 block text-[9px] mb-0.5">
                              Replying to {msg.replyTo.sender?.username || msg.replyTo.senderName || 'User'}
                            </strong>
                            "{msg.replyTo.content}"
                          </div>
                        )}
                        <p className="px-3 py-1.5">{msg.content}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1 px-1">
                        <span className="text-[9px] text-slate-500 select-none">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="select-none text-slate-600">•</span>
                        
                        {/* Reply Action Trigger */}
                        <button
                          onClick={() => setReplyingTo(msg)}
                          className="text-[9px] text-slate-500 hover:text-blue-400 hover:underline font-semibold cursor-pointer select-none transition-colors"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-center select-none">
                  <p className="text-xs text-slate-500 max-w-[200px]">
                    No message history. Write your first message to {activeUser.username} below.
                  </p>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Active Quoted Reply Preview Bar (Renders above text box) */}
            {replyingTo && (
              <div className="px-4 py-2 border-t border-slate-850 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400 animate-slideUp">
                <div className="truncate pr-4 border-l-2 border-blue-500 pl-2">
                  <span className="text-[10px] text-blue-400 font-bold block uppercase tracking-wider select-none">
                    Replying to {replyingTo.sender?.username || replyingTo.senderName}
                  </span>
                  <p className="truncate italic text-[11px]">"{replyingTo.content}"</p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer text-sm select-none"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Input Submission Footer */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-850 bg-slate-950/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`Message ${activeUser.username}...`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  disabled={!isConnected}
                />
                <button
                  type="submit"
                  disabled={!text.trim() || !isConnected}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm select-none">
            Select a user from the sidebar directory to begin chatting.
          </div>
        )}
      </main>
    </div>
  );
}