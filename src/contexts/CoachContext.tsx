import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { useTimerContext } from './TimerContext';
import { Task } from '@/types/task';

interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface CoachAction {
  type: string;
  status: 'executing' | 'success' | 'error';
  message: string;
}

interface CoachContextType {
  messages: CoachMessage[];
  isLoading: boolean;
  isMinimized: boolean;
  unreadCount: number;
  conversationId: string | null;
  currentAction: CoachAction | null;
  sendMessage: (content: string) => Promise<void>;
  triggerProactiveCoaching: (trigger: string, context?: any) => Promise<void>;
  showCheckIn: () => void;
  submitCheckIn: (mood: number, energy: number, stress: number, notes?: string) => Promise<void>;
  toggleMinimize: () => void;
  markAsRead: () => void;
  checkInModalOpen: boolean;
  setCheckInModalOpen: (open: boolean) => void;
  onResponseReceived?: (text: string) => void;
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

const CoachContext = createContext<CoachContextType | undefined>(undefined);

export const CoachProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const timer = useTimerContext();
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [lastTriggerTime, setLastTriggerTime] = useState<number>(0);
  const [currentAction, setCurrentAction] = useState<CoachAction | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load tasks
  useEffect(() => {
    if (!user) return;

    const loadTasks = async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('sort_order', { ascending: true });
      
      if (data) {
        const mappedTasks: Task[] = data.map(t => ({
          id: t.id,
          name: t.name,
          estimatedPomodoros: t.estimated_pomodoros,
          completed: t.completed,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          completedAt: t.completed_at || undefined,
          completedPomodoros: t.completed_pomodoros || undefined,
          isActive: t.is_active || false,
          timeSpent: t.time_spent,
          timeSpentSeconds: t.time_spent_seconds
        }));
        setTasks(mappedTasks);
      }
    };

    loadTasks();
  }, [user]);

  // Execute tool actions
  const executeToolAction = useCallback(async (toolCall: any) => {
    if (!user || !conversationId) return null;

    const { name, arguments: args } = toolCall.function;
    let parsedArgs: any = {};
    
    try {
      parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
    } catch (e) {
      console.error('Failed to parse tool arguments:', e);
      return { error: 'Invalid arguments' };
    }

    console.log('Executing tool:', name, parsedArgs);

    try {
      let result: any = {};
      
      switch (name) {
        case 'add_task': {
          setCurrentAction({ type: 'add_task', status: 'executing', message: `Adding task: ${parsedArgs.name}...` });
          
          const { data: newTask, error } = await supabase
            .from('tasks')
            .insert({
              user_id: user.id,
              name: parsedArgs.name,
              estimated_pomodoros: parsedArgs.estimated_pomodoros || 1,
              completed: false,
              is_active: false,
              time_spent: 0
            })
            .select()
            .single();

          if (error) throw error;
          
          const mappedTask: Task = {
            id: newTask.id,
            name: newTask.name,
            estimatedPomodoros: newTask.estimated_pomodoros,
            completed: newTask.completed,
            createdAt: newTask.created_at,
            updatedAt: newTask.updated_at,
            completedAt: newTask.completed_at || undefined,
            completedPomodoros: newTask.completed_pomodoros || undefined,
            isActive: newTask.is_active || false,
            timeSpent: newTask.time_spent,
            timeSpentSeconds: newTask.time_spent_seconds
          };
          
          setTasks(prev => [...prev, mappedTask]);
          
          await supabase.from('coach_actions').insert({
            conversation_id: conversationId,
            user_id: user.id,
            action_type: 'add_task',
            action_params: { task_id: newTask.id, name: parsedArgs.name },
            success: true
          });

          setCurrentAction({ type: 'add_task', status: 'success', message: `Added: ${parsedArgs.name}` });
          setTimeout(() => setCurrentAction(null), 3000);
          
          result = { success: true, task_id: newTask.id, message: `Task "${parsedArgs.name}" added successfully` };
          break;
        }

        case 'complete_task': {
          setCurrentAction({ type: 'complete_task', status: 'executing', message: 'Completing task...' });
          
          const { data: task, error } = await supabase
            .from('tasks')
            .update({ completed: true, completed_at: new Date().toISOString() })
            .eq('id', parsedArgs.task_id)
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) throw error;
          
          setTasks(prev => prev.filter(t => t.id !== parsedArgs.task_id));
          
          await supabase.from('coach_actions').insert({
            conversation_id: conversationId,
            user_id: user.id,
            action_type: 'complete_task',
            action_params: { task_id: parsedArgs.task_id },
            success: true
          });

          setCurrentAction({ type: 'complete_task', status: 'success', message: `Task completed!` });
          setTimeout(() => setCurrentAction(null), 3000);
          
          result = { success: true, message: `Task completed` };
          break;
        }

        case 'start_timer': {
          setCurrentAction({ type: 'start_timer', status: 'executing', message: 'Starting timer...' });
          
          timer.handleStart();
          
          await supabase.from('coach_actions').insert({
            conversation_id: conversationId,
            user_id: user.id,
            action_type: 'start_timer',
            action_params: {},
            success: true
          });

          setCurrentAction({ type: 'start_timer', status: 'success', message: 'Timer started!' });
          setTimeout(() => setCurrentAction(null), 3000);
          
          result = { success: true, message: 'Timer started' };
          break;
        }

        case 'pause_timer': {
          setCurrentAction({ type: 'pause_timer', status: 'executing', message: 'Pausing timer...' });
          
          timer.handlePause();
          
          await supabase.from('coach_actions').insert({
            conversation_id: conversationId,
            user_id: user.id,
            action_type: 'pause_timer',
            action_params: {},
            success: true
          });

          setCurrentAction({ type: 'pause_timer', status: 'success', message: 'Timer paused' });
          setTimeout(() => setCurrentAction(null), 3000);
          
          result = { success: true, message: 'Timer paused' };
          break;
        }

        case 'set_active_task': {
          const taskToActivate = tasks.find(t => t.id === parsedArgs.task_id);
          setCurrentAction({ 
            type: 'set_active_task', 
            status: 'executing', 
            message: `Setting active task...` 
          });
          
          // Deactivate all tasks
          await supabase
            .from('tasks')
            .update({ is_active: false })
            .eq('user_id', user.id);

          // Activate selected task
          if (parsedArgs.task_id) {
            await supabase
              .from('tasks')
              .update({ is_active: true })
              .eq('id', parsedArgs.task_id)
              .eq('user_id', user.id);
          }

          setTasks(prev => prev.map(t => ({ ...t, isActive: t.id === parsedArgs.task_id })));
          
          await supabase.from('coach_actions').insert({
            conversation_id: conversationId,
            user_id: user.id,
            action_type: 'set_active_task',
            action_params: { task_id: parsedArgs.task_id },
            success: true
          });

          setCurrentAction({ 
            type: 'set_active_task', 
            status: 'success', 
            message: taskToActivate ? `Now working on: ${taskToActivate.name}` : 'Task cleared' 
          });
          setTimeout(() => setCurrentAction(null), 3000);
          
          result = { success: true, message: parsedArgs.task_id ? 'Active task set' : 'Active task cleared' };
          break;
        }

        default:
          result = { error: `Unknown tool: ${name}` };
      }

      return result;

    } catch (error) {
      console.error('Tool execution error:', error);
      setCurrentAction({ 
        type: name, 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Action failed' 
      });
      setTimeout(() => setCurrentAction(null), 3000);

      await supabase.from('coach_actions').insert({
        conversation_id: conversationId,
        user_id: user.id,
        action_type: name,
        action_params: parsedArgs,
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });

      return { error: error instanceof Error ? error.message : 'Tool execution failed' };
    }
  }, [user, conversationId, tasks, timer]);

  // Get current state for context injection
  const getCurrentState = useCallback(() => {
    return {
      timerState: {
        isRunning: timer.isRunning,
        mode: timer.timerMode,
        timeRemaining: timer.timeRemaining,
        currentSessionIndex: timer.currentSessionIndex,
        sessionsUntilLongBreak: timer.settings.sessionsUntilLongBreak
      },
      taskState: {
        tasks: tasks.map(t => ({
          id: t.id,
          name: t.name,
          estimated_pomodoros: t.estimatedPomodoros,
          is_active: t.isActive,
          completed: t.completed
        }))
      }
    };
  }, [timer, tasks]);

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

      // Get user's session token for edge function auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      // Stream AI response with tool support
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content
            })),
            ...getCurrentState()
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Handle streaming with tool calls
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let assistantMessageId = `temp-assistant-${Date.now()}`;
      let toolCalls: any[] = [];

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
              const delta = parsed.choices?.[0]?.delta;
              
              // Handle tool calls
              if (delta?.tool_calls) {
                for (const toolCallDelta of delta.tool_calls) {
                  const index = toolCallDelta.index || 0;
                  
                  if (!toolCalls[index]) {
                    toolCalls[index] = {
                      id: toolCallDelta.id,
                      type: 'function',
                      function: {
                        name: toolCallDelta.function?.name || '',
                        arguments: toolCallDelta.function?.arguments || ''
                      }
                    };
                  } else {
                    if (toolCallDelta.function?.arguments) {
                      toolCalls[index].function.arguments += toolCallDelta.function.arguments;
                    }
                  }
                }
              }
              
              // Handle regular content
              const content = delta?.content;
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

      // Execute any tool calls
      if (toolCalls.length > 0) {
        console.log('Tool calls detected:', toolCalls);
        
        for (const toolCall of toolCalls) {
          const result = await executeToolAction(toolCall);
          console.log('Tool result:', result);
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

      // Get user's session token for edge function auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      // Call AI with trigger context and current state
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: messages.map(m => ({
              role: m.role,
              content: m.content
            })),
            trigger,
            triggerContext: context,
            ...getCurrentState()
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
    currentAction,
    sendMessage,
    triggerProactiveCoaching,
    showCheckIn,
    submitCheckIn,
    toggleMinimize,
    markAsRead,
    checkInModalOpen,
    setCheckInModalOpen,
    tasks,
    setTasks
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
