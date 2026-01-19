import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export interface ChatSession {
  id: string;
  title: string;
  persona: string;
  exam_board: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  linked_task_id?: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  sources?: Array<{
    id: string;
    topic?: string;
    page_number?: number;
    document_title?: string;
    content_preview: string;
    similarity: number;
  }>;
}

export const useChatSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Load all sessions for the user
  const loadSessions = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingSessions(true);
    try {
      const { data, error } = await supabase
        .from('coach_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const mappedSessions: ChatSession[] = (data || []).map(s => ({
        id: s.id,
        title: (s as any).title || 'Untitled session',
        persona: (s as any).persona || 'explain',
        exam_board: (s as any).exam_board || 'Edexcel',
        created_at: s.created_at,
        updated_at: s.updated_at,
        last_message_at: s.last_message_at,
        linked_task_id: (s as any).linked_task_id || null,
      }));

      setSessions(mappedSessions);
      
      // Set current session to the most recent one if not already set
      if (!currentSession && mappedSessions.length > 0) {
        setCurrentSession(mappedSessions[0]);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [user, currentSession]);

  // Load messages for a specific session
  const loadMessages = useCallback(async (sessionId: string) => {
    if (!user) return;
    
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('coach_messages')
        .select('*')
        .eq('conversation_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mappedMessages: ChatMessage[] = (data || []).map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        created_at: m.created_at,
      }));

      setMessages(mappedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user]);

  // Create a new session
  const createNewSession = useCallback(async (persona: string = 'explain', linkedTaskId?: string, taskName?: string) => {
    if (!user) return null;
    
    try {
      const title = taskName || `New session – ${format(new Date(), 'MMM d, yyyy')}`;
      
      const { data, error } = await supabase
        .from('coach_conversations')
        .insert({
          user_id: user.id,
          title,
          persona,
          exam_board: 'Edexcel',
          started_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
          linked_task_id: linkedTaskId || null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      const newSession: ChatSession = {
        id: data.id,
        title: (data as any).title || title,
        persona: (data as any).persona || persona,
        exam_board: (data as any).exam_board || 'Edexcel',
        created_at: data.created_at,
        updated_at: data.updated_at,
        last_message_at: data.last_message_at,
        linked_task_id: (data as any).linked_task_id || null,
      };

      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);

      return newSession;
    } catch (error) {
      console.error('Failed to create session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new chat session',
        variant: 'destructive',
      });
      return null;
    }
  }, [user]);

  // Find or create a session linked to a specific task
  const openTaskSession = useCallback(async (taskId: string, taskName: string) => {
    if (!user) return null;
    
    // First check if we already have a session for this task in local state
    const existingSession = sessions.find(s => s.linked_task_id === taskId);
    if (existingSession) {
      setCurrentSession(existingSession);
      await loadMessages(existingSession.id);
      return existingSession;
    }
    
    // Check the database for an existing session
    try {
      const { data, error } = await supabase
        .from('coach_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('linked_task_id', taskId)
        .single();

      if (data && !error) {
        const session: ChatSession = {
          id: data.id,
          title: (data as any).title || taskName,
          persona: (data as any).persona || 'explain',
          exam_board: (data as any).exam_board || 'Edexcel',
          created_at: data.created_at,
          updated_at: data.updated_at,
          last_message_at: data.last_message_at,
          linked_task_id: (data as any).linked_task_id,
        };
        
        // Add to sessions if not already there
        setSessions(prev => {
          if (prev.some(s => s.id === session.id)) return prev;
          return [session, ...prev];
        });
        setCurrentSession(session);
        await loadMessages(session.id);
        return session;
      }
    } catch (e) {
      // No existing session found, will create new one
    }
    
    // Create a new session linked to this task
    return createNewSession('explain', taskId, taskName);
  }, [user, sessions, loadMessages, createNewSession]);

  // Switch to a different session
  const switchSession = useCallback(async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
      await loadMessages(sessionId);
    }
  }, [sessions, loadMessages]);

  // Update session title
  const updateSessionTitle = useCallback(async (sessionId: string, newTitle: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('coach_conversations')
        .update({ title: newTitle } as any)
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, title: newTitle } : s
      ));
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(prev => prev ? { ...prev, title: newTitle } : null);
      }
    } catch (error) {
      console.error('Failed to update session title:', error);
    }
  }, [user, currentSession]);

  // Delete a session
  const deleteSession = useCallback(async (sessionId: string) => {
    if (!user) return;
    
    try {
      // Delete messages first
      await supabase
        .from('coach_messages')
        .delete()
        .eq('conversation_id', sessionId);

      // Then delete the session
      const { error } = await supabase
        .from('coach_conversations')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // If we deleted the current session, switch to the next one
      if (currentSession?.id === sessionId) {
        const remaining = sessions.filter(s => s.id !== sessionId);
        if (remaining.length > 0) {
          setCurrentSession(remaining[0]);
          await loadMessages(remaining[0].id);
        } else {
          setCurrentSession(null);
          setMessages([]);
        }
      }

      toast({
        title: 'Session deleted',
        description: 'Chat session has been removed',
      });
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete session',
        variant: 'destructive',
      });
    }
  }, [user, currentSession, sessions, loadMessages]);

  // Add a message to the current session
  const addMessage = useCallback(async (role: 'user' | 'assistant', content: string) => {
    if (!user || !currentSession) return null;
    
    try {
      const { data, error } = await supabase
        .from('coach_messages')
        .insert({
          conversation_id: currentSession.id,
          user_id: user.id,
          role,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      const newMessage: ChatMessage = {
        id: data.id,
        role: data.role as 'user' | 'assistant',
        content: data.content,
        created_at: data.created_at,
      };

      setMessages(prev => [...prev, newMessage]);

      // Update the session's last_message_at
      await supabase
        .from('coach_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', currentSession.id);

      return newMessage;
    } catch (error) {
      console.error('Failed to add message:', error);
      return null;
    }
  }, [user, currentSession]);

  // Initial load
  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user, loadSessions]);

  // Load messages when current session changes
  useEffect(() => {
    if (currentSession) {
      loadMessages(currentSession.id);
    }
  }, [currentSession?.id, loadMessages]);

  // Compute set of task IDs that have linked sessions
  const linkedTaskIds = useMemo(() => {
    const ids = new Set<string>();
    sessions.forEach(s => {
      if (s.linked_task_id) {
        ids.add(s.linked_task_id);
      }
    });
    return ids;
  }, [sessions]);

  return {
    sessions,
    currentSession,
    messages,
    setMessages,
    isLoadingSessions,
    isLoadingMessages,
    loadSessions,
    loadMessages,
    createNewSession,
    switchSession,
    updateSessionTitle,
    deleteSession,
    addMessage,
    openTaskSession,
    linkedTaskIds,
  };
};
