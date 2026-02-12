import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CoachConversationRow, CoachMessageRow, TopicSessionRow } from '@/types/database';

export interface ChatSession {
  id: string;
  title: string;
  persona: string;
  exam_board: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  linked_task_id: string | null;
  linked_topic_id: string | null;
  linked_subtopic: string | null;
}

export type TutorMode = 'explain' | 'practice' | 'upload';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  mode?: TutorMode;
  sources?: Array<{
    id: string;
    topic?: string;
    page_number?: number;
    document_title?: string;
    content_preview: string;
    similarity: number;
  }>;
}

// Map database row to ChatSession
const mapConversationRow = (row: CoachConversationRow & { linked_subtopic?: string | null }): ChatSession => ({
  id: row.id,
  title: row.title ?? 'Untitled session',
  persona: row.persona ?? 'explain',
  exam_board: row.exam_board ?? 'Edexcel',
  created_at: row.created_at,
  updated_at: row.updated_at,
  last_message_at: row.last_message_at,
  linked_task_id: row.linked_task_id ?? null,
  linked_topic_id: row.linked_topic_id ?? null,
  linked_subtopic: row.linked_subtopic ?? null,
});

// Map database row to ChatMessage
const mapMessageRow = (row: CoachMessageRow & { mode?: string }): ChatMessage => ({
  id: row.id,
  role: row.role as 'user' | 'assistant',
  content: row.content,
  created_at: row.created_at,
  mode: (row.mode as TutorMode) || 'explain',
});

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

      const mappedSessions = (data ?? []).map(mapConversationRow);
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
  // For topic-linked sessions, filter by mode to support separate chats per mode
  const loadMessages = useCallback(async (sessionId: string, filterByMode?: TutorMode) => {
    if (!user) return;
    
    setIsLoadingMessages(true);
    try {
      let query = supabase
        .from('coach_messages')
        .select('*')
        .eq('conversation_id', sessionId)
        .order('created_at', { ascending: true });
      
      // Filter messages by mode if specified (for topic-linked sessions with mixed historical content)
      if (filterByMode) {
        query = query.eq('mode', filterByMode);
      }
      
      const { data, error } = await query;

      if (error) throw error;

      const mappedMessages = (data ?? []).map(mapMessageRow);
      setMessages(mappedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user]);

  // Create a new session
  const createNewSession = useCallback(async (
    persona: string = 'explain', 
    linkedTaskId?: string, 
    taskName?: string,
    linkedTopicId?: string,
    linkedSubtopic?: string
  ): Promise<ChatSession | null> => {
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
          linked_task_id: linkedTaskId ?? null,
          linked_topic_id: linkedTopicId ?? null,
          linked_subtopic: linkedSubtopic ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      const newSession = mapConversationRow(data);
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

  // Find or create a session linked to a specific task, topic, or subtopic
  // Sessions are now keyed by: topic + subtopic + mode (persona)
  const openTaskSession = useCallback(async (
    taskOrTopicId: string, 
    taskName: string, 
    isTopicId: boolean = false,
    initialMode: TutorMode = 'explain',
    subtopic?: string
  ): Promise<ChatSession | null> => {
    if (!user) return null;
    
    // Immediately clear messages to prevent showing stale content while loading
    setMessages([]);
    
    // Determine which field to use based on whether this is a topic ID or task ID
    const fieldName = isTopicId ? 'linked_topic_id' : 'linked_task_id';
    
    // ALWAYS check the database first for the authoritative session
    // This prevents stale local state from returning wrong sessions
    try {
      let query = supabase
        .from('coach_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq(fieldName, taskOrTopicId);
      
      // For topics, also filter by persona (mode) and subtopic
      if (isTopicId) {
        query = query.eq('persona', initialMode);
        if (subtopic) {
          query = query.eq('linked_subtopic', subtopic);
        } else {
          query = query.is('linked_subtopic', null);
        }
      }
      
      const { data, error } = await query.maybeSingle();

      if (data && !error) {
        const session = mapConversationRow(data);
        
        // Update local sessions cache
        setSessions(prev => {
          const existing = prev.find(s => s.id === session.id);
          if (existing) {
            // Update existing entry
            return prev.map(s => s.id === session.id ? session : s);
          }
          return [session, ...prev];
        });
        setCurrentSession(session);
        // For topic-linked sessions, filter messages by mode to handle historical mixed content
        await loadMessages(session.id, isTopicId ? initialMode : undefined);
        return session;
      }
    } catch (e) {
      console.error('Error looking up session:', e);
    }
    
    // No existing session found, create a new one
    if (isTopicId) {
      return createNewSession(initialMode, undefined, taskName, taskOrTopicId, subtopic);
    } else {
      return createNewSession('explain', taskOrTopicId, taskName);
    }
  }, [user, loadMessages, createNewSession]);

  // Switch to a different mode session for the current topic/subtopic
  // This finds or creates a session for the specified mode while keeping the same topic+subtopic context
  const switchTopicModeSession = useCallback(async (
    topicId: string,
    topicName: string,
    newMode: TutorMode,
    subtopic?: string
  ): Promise<ChatSession | null> => {
    return openTaskSession(topicId, topicName, true, newMode, subtopic);
  }, [openTaskSession]);

  // Switch to a different session
  const switchSession = useCallback(async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
      // For topic-linked sessions, filter messages by the session's persona (mode)
      // to prevent crossover between explain/practice message histories
      const modeFilter = session.linked_topic_id
        ? (session.persona as TutorMode)
        : undefined;
      await loadMessages(sessionId, modeFilter);
    }
  }, [sessions, loadMessages]);

  // Update session title
  const updateSessionTitle = useCallback(async (sessionId: string, newTitle: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('coach_conversations')
        .update({ title: newTitle })
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
      // Get the session info before deleting to check if it's topic-linked
      const sessionToDelete = sessions.find(s => s.id === sessionId);
      const linkedTopicId = sessionToDelete?.linked_topic_id;
      
      // Delete the session (messages are automatically deleted via CASCADE)
      const { error } = await supabase
        .from('coach_conversations')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // If this was a topic-linked session, update the topic_sessions message count
      if (linkedTopicId) {
        try {
          // Count remaining messages for this topic across all sessions
          const { data: remainingSessions } = await supabase
            .from('coach_conversations')
            .select('id')
            .eq('user_id', user.id)
            .eq('linked_topic_id', linkedTopicId);
          
          if (remainingSessions && remainingSessions.length > 0) {
            // Count total messages across all remaining sessions for this topic
            const sessionIds = remainingSessions.map(s => s.id);
            const { count } = await supabase
              .from('coach_messages')
              .select('id', { count: 'exact', head: true })
              .in('conversation_id', sessionIds);
            
            // Update topic_sessions with new message count
            await supabase
              .from('topic_sessions')
              .update({ message_count: count || 0 })
              .eq('user_id', user.id)
              .eq('topic_id', linkedTopicId);
          } else {
            // No remaining sessions for this topic, set message count to 0
            await supabase
              .from('topic_sessions')
              .update({ message_count: 0 })
              .eq('user_id', user.id)
              .eq('topic_id', linkedTopicId);
          }
        } catch (topicError) {
          console.error('Error updating topic message count:', topicError);
          // Don't fail the whole deletion if this update fails
        }
      }
      
      // If we deleted the current session, switch to the next one
      if (currentSession?.id === sessionId) {
        const remaining = sessions.filter(s => s.id !== sessionId);
        if (remaining.length > 0) {
          const nextSession = remaining[0];
          setCurrentSession(nextSession);
          // For topic-linked sessions, filter messages by persona (mode)
          const modeFilter = nextSession.linked_topic_id
            ? (nextSession.persona as TutorMode)
            : undefined;
          await loadMessages(nextSession.id, modeFilter);
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
  const addMessage = useCallback(async (role: 'user' | 'assistant', content: string): Promise<ChatMessage | null> => {
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

      const newMessage = mapMessageRow(data);
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

  // NOTE: Messages are loaded explicitly by openTaskSession(), switchSession(),
  // and switchTopicModeSession(). A useEffect here caused a race condition where
  // the effect would re-load messages with potentially stale mode filter AFTER
  // the explicit load had already set the correct messages, causing practice
  // messages to appear in explain mode and vice versa. Removed to fix crossover.

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
    switchTopicModeSession,
    linkedTaskIds,
  };
};
