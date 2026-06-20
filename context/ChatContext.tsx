// context/ChatContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from '../app/hooks/useSockects'; // Adjust path to @/app/hooks/useSocket if hooks is inside app/

export interface Message {
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

interface ChatContextType {
  isOpen: boolean;
  activeRecipient: { id: string; username: string } | null;
  messages: Message[];
  openChat: (userId: string, username: string) => void;
  closeChat: () => void;
  currentUserId?: string;
  sendMessage: (content: string, senderId: string, senderName: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within a ChatProvider");
  return context;
};

export const ChatProvider = ({ 
  children, 
  currentUserId 
}: { 
  children: React.ReactNode; 
  currentUserId?: string;
}) => {
  const { socket, isConnected } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [activeRecipient, setActiveRecipient] = useState<{ id: string; username: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Listen for socket connection and incoming messages
  useEffect(() => {
    if (!socket || !isConnected || !currentUserId) return;

    // Join personal room
    socket.emit('join_room', currentUserId);

    const handleReceiveMessage = (msg: Message) => {
      // 1. If we are the recipient and our chat drawer is closed or set to someone else:
      // Automatically slide open the drawer and target the sender
      if (msg.senderId !== currentUserId) {
        setActiveRecipient({ id: msg.senderId, username: msg.senderName });
        setIsOpen(true);
      }

      // 2. Append the incoming message to the message state
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, isConnected, currentUserId]);

  const openChat = (userId: string, username: string) => {
    if (userId === currentUserId) return; // Prevent self-DMing

    // Only clear messages if opening a completely new chat with a different user
    if (activeRecipient?.id !== userId) {
      setMessages([]); 
    }
    
    setActiveRecipient({ id: userId, username });
    setIsOpen(true);
  };

  const closeChat = () => {
    setIsOpen(false);
    setActiveRecipient(null);
  };

  const sendMessage = (content: string, senderId: string, senderName: string) => {
    if (!socket || !activeRecipient) return;

    const payload = {
      recipientId: activeRecipient.id,
      senderId,
      senderName,
      content: content.trim(),
    };

    socket.emit('send_message', payload);
  };

  return (
    <ChatContext.Provider value={{ isOpen, activeRecipient, messages, openChat, closeChat, currentUserId, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};