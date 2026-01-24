import React, { createContext, useContext, useMemo } from 'react';
import { useChatSessions } from '@/hooks/useChatSessions';

type ChatSessionsContextValue = ReturnType<typeof useChatSessions>;

const ChatSessionsContext = createContext<ChatSessionsContextValue | null>(null);

export const ChatSessionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Single source of truth for chat sessions across the app.
  const value = useChatSessions();
  const memoValue = useMemo(() => value, [value]);

  return (
    <ChatSessionsContext.Provider value={memoValue}>
      {children}
    </ChatSessionsContext.Provider>
  );
};

export const useChatSessionsContext = () => {
  const ctx = useContext(ChatSessionsContext);
  if (!ctx) {
    throw new Error('useChatSessionsContext must be used within a ChatSessionsProvider');
  }
  return ctx;
};
