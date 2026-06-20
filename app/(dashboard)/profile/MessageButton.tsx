// components/profile/MessageButton.tsx
'use client';

import { useChat } from '@/context/ChatContext';

interface MessageButtonProps {
  userId: string;
  username: string;
  currentUserId?: string;
}

export default function MessageButton({ userId, username, currentUserId }: MessageButtonProps) {
  const { openChat } = useChat();

  // Do not display the message button if a user is viewing their own profile
  if (userId === currentUserId) return null;

  return (
    <button
      onClick={() => openChat(userId, username)}
      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg transition shadow-md flex items-center gap-2"
    >
      💬 Send Message
    </button>
  );
}