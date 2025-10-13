import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface CoachContextType {
  messages: CoachMessage[];
  isLoading: boolean;
  isMinimized: boolean;
  unreadCount: number;
  conversationId: string | null;
  sendMessage: (content: string) => Promise<void>;
  triggerProactiveCoaching: (trigger: string, context?: any) => Promise<void>;
  showCheckIn: () => void;
  submitCheckIn: (mood: number, energy: number, stress: number, notes?: string) => Promise<void>;
  toggleMinimize: () => void;
  markAsRead: () => void;
  checkInModalOpen: boolean;
  setCheckInModalOpen: (open: boolean) => void;
}

const CoachContext = createContext<CoachContextType | undefined>(undefined);

export const CoachProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [lastTriggerTime, setLastTriggerTime] = useState<number>(0);

  // Load or create conversation
  useEffect(() => {
    if (!user) return;

    const loadConversation = async () => {
      // Get or create conversation
      const { data: existingConv } = await supabase
        .from('coach_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingConv) {
        setConversationId(existingConv.id);
        
        // Load messages
        const { data: msgs } = await supabase
          .from('coach_messages')
          .select('*')
          .eq('conversation_id', existingConv.id)
          .order('created_at', { ascending: true });

        if (msgs) {
          setMessages(msgs.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            created_at: m.created_at
          })));
        }
      } else if (messages.length === 0) {
        // First time user - trigger welcome message
        setTimeout(() => {
          triggerProactiveCoaching('first_interaction');
        }, 1000);
      }
    };

    loadConversation();
  }, [user]);

  // Listen for coaching triggers from TimerContext
  useEffect(() => {
    const handlePomodoroEvents = (e: Event) => {
      const customEvent = e as CustomEvent;
      triggerProactiveCoaching('pomodoro_cycle_complete', customEvent.detail);
    };

    const handleExtendedWork = (e: Event) => {
      const customEvent = e as CustomEvent;
      triggerProactiveCoaching('extended_work_detected', customEvent.detail);
    };

    window.addEventListener('coach:pomodoro-cycle', handlePomodoroEvents);
    window.addEventListener('coach:extended-work', handleExtendedWork);

    return () => {
      window.removeEventListener('coach:pomodoro-cycle', handlePomodoroEvents);
      window.removeEventListener('coach:extended-work', handleExtendedWork);
    };
  }, []);

  const createConversationIfNeeded = async () => {
    if (!user) return null;
    
    if (conversationId) return conversationId;

    const { data, error } = await supabase
      .from('coach_conversations')
      .insert({
        user_id: user.id,
        started_at: new Date().toISOString(),
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    setConversationId(data.id);
    return data.id;
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      const convId = await createConversationIfNeeded();
      if (!convId) throw new Error('No conversation');

      // Add user message to UI
      const userMessage: CoachMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      // Save user message to DB
      await supabase
        .from('coach_messages')
        .insert({
          conversation_id: convId,
          user_id: user.id,
          role: 'user',
          content
        });

      // Stream AI response
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content
            }))
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Handle streaming
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let assistantMessageId = `temp-assistant-${Date.now()}`;

      // Add initial assistant message
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      }]);

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim() || line.startsWith(':')) continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => prev.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, content: assistantContent }
                    : m
                ));
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }

      // Save assistant message to DB
      const { data: savedMsg } = await supabase
        .from('coach_messages')
        .insert({
          conversation_id: convId,
          user_id: user.id,
          role: 'assistant',
          content: assistantContent
        })
        .select()
        .single();

      if (savedMsg) {
        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId 
            ? { ...m, id: savedMsg.id }
            : m
        ));
      }

      // Update conversation
      await supabase
        .from('coach_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', convId);

      // Increment unread if minimized
      if (isMinimized) {
        setUnreadCount(prev => prev + 1);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, messages, isLoading, conversationId, isMinimized]);

  const triggerProactiveCoaching = useCallback(async (trigger: string, context?: any) => {
    if (!user || isLoading) return;

    // Throttle proactive triggers (30 seconds cooldown)
    const now = Date.now();
    if (now - lastTriggerTime < 30000) {
      console.log('Throttling proactive trigger');
      return;
    }
    setLastTriggerTime(now);

    setIsLoading(true);
    try {
      const convId = await createConversationIfNeeded();
      if (!convId) throw new Error('No conversation');

      // Call AI with trigger context
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: messages.map(m => ({
              role: m.role,
              content: m.content
            })),
            trigger,
            triggerContext: context
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to trigger coaching');

      // Stream response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let assistantMessageId = `temp-assistant-${Date.now()}`;

      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      }]);

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim() || line.startsWith(':')) continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => prev.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, content: assistantContent }
                    : m
                ));
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }

      // Save to DB
      await supabase
        .from('coach_messages')
        .insert({
          conversation_id: convId,
          user_id: user.id,
          role: 'assistant',
          content: assistantContent
        });

      await supabase
        .from('coach_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', convId);

      // Increment unread if minimized
      if (isMinimized) {
        setUnreadCount(prev => prev + 1);
      }

    } catch (error) {
      console.error('Error triggering proactive coaching:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, messages, isLoading, conversationId, isMinimized, lastTriggerTime]);

  const showCheckIn = useCallback(() => {
    setCheckInModalOpen(true);
  }, []);

  const submitCheckIn = useCallback(async (mood: number, energy: number, stress: number, notes?: string) => {
    if (!user) return;

    try {
      await supabase
        .from('coach_check_ins')
        .insert({
          user_id: user.id,
          mood_rating: mood,
          energy_level: energy,
          stress_level: stress,
          notes: notes || null
        });

      setCheckInModalOpen(false);

      // Trigger coach response about the check-in
      await triggerProactiveCoaching('wellbeing_check_in', { mood, energy, stress, notes });

      toast({
        title: 'Check-in saved',
        description: 'Your wellbeing coach will respond shortly'
      });

    } catch (error) {
      console.error('Error submitting check-in:', error);
      toast({
        title: 'Error',
        description: 'Failed to save check-in',
        variant: 'destructive'
      });
    }
  }, [user, triggerProactiveCoaching]);

  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
    if (isMinimized) {
      setUnreadCount(0);
    }
  }, [isMinimized]);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const value: CoachContextType = {
    messages,
    isLoading,
    isMinimized,
    unreadCount,
    conversationId,
    sendMessage,
    triggerProactiveCoaching,
    showCheckIn,
    submitCheckIn,
    toggleMinimize,
    markAsRead,
    checkInModalOpen,
    setCheckInModalOpen
  };

  return (
    <CoachContext.Provider value={value}>
      {children}
    </CoachContext.Provider>
  );
};

export const useCoach = () => {
  const context = useContext(CoachContext);
  if (context === undefined) {
    throw new Error('useCoach must be used within a CoachProvider');
  }
  return context;
};
