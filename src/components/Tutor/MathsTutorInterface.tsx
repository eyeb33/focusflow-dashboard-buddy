import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Send, BookOpen, PenTool, ImagePlus, Clock, CheckCircle, Check, X, Pencil, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import MathsMessage, { RAGSource, TutorMode } from './MathsMessage';
import ImageUploadModal, { ImageIntent } from './ImageUploadModal';
import { ChatMessage } from '@/hooks/useChatSessions';
import { useChatSessionsContext } from '@/contexts/ChatSessionsContext';
import { useTopicTime } from '@/contexts/TopicTimeContext';
import * as taskService from '@/services/taskService';
import { fetchSubTasks, addSubTask, updateSubTaskCompletion, deleteSubTask } from '@/services/subTaskService';
import { getTopicOverview } from '@/data/topicOverviews';

// TutorMode is now imported from MathsMessage

interface AIMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface ToolResult {
  tool_call_id: string;
  role: 'tool';
  name: string;
  content: string;
}

export interface MathsTutorInterfaceRef {
  openTaskSession: (taskId: string, taskName: string, isTopicId?: boolean) => Promise<void>;
  linkedTaskIds: Set<string>;
  linkedTopicIds: Set<string>;
}

interface ActiveTopicInfo {
  id: string;
  name: string;
  totalTimeSeconds: number;
  completedSubtopics: string[];
  subtopics: string[]; // Full list of subtopics from curriculum
}

interface MathsTutorInterfaceProps {
  inputPortalTarget?: HTMLElement | null;
  activeTopic?: ActiveTopicInfo | null;
  onOpenSettings?: () => void;
  onSubtopicClick?: (subtopic: string) => void;
}

const MathsTutorInterface = forwardRef<MathsTutorInterfaceRef, MathsTutorInterfaceProps>((props, ref) => {
  const { user } = useAuth();
  const {
    sessions,
    currentSession,
    messages,
    setMessages,
    isLoadingSessions,
    isLoadingMessages,
    createNewSession,
    switchSession,
    updateSessionTitle,
    deleteSession,
    openTaskSession,
    switchTopicModeSession,
    linkedTaskIds,
  } = useChatSessionsContext();

  // Get reactive time tracking from context
  const { getTopicTotalTime } = useTopicTime();

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<TutorMode>('explain');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);

  // Hard lock to prevent double-submits (Enter + click, double-click, etc.)
  const inFlightSendRef = useRef(false);

  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState(() => Date.now());

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Compute set of topic IDs that have linked sessions
  const linkedTopicIds = useMemo(() => {
    const ids = new Set<string>();
    sessions.forEach(s => {
      if ((s as any).linked_topic_id) {
        ids.add((s as any).linked_topic_id);
      }
    });
    return ids;
  }, [sessions]);

  // Expose openTaskSession and linkedTaskIds via ref for parent components
  useImperativeHandle(ref, () => ({
    openTaskSession: async (taskId: string, taskName: string, isTopicId: boolean = false) => {
      // When opening a topic, use the current mode (or default to explain)
      await openTaskSession(taskId, taskName, isTopicId, mode);
    },
    linkedTaskIds,
    linkedTopicIds
  }), [openTaskSession, linkedTaskIds, linkedTopicIds, mode]);

  const scrollToBottom = () => {
    // Use container scroll instead of scrollIntoView to prevent page scroll
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Delay scroll to ensure content is rendered
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [messages]);

  useEffect(() => {
    if (!cooldownUntil) return;

    const t = window.setInterval(() => setNowTs(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [cooldownUntil]);

  const cooldownSecondsRemaining = cooldownUntil
    ? Math.max(0, Math.ceil((cooldownUntil - nowTs) / 1000))
    : 0;

  const isRateLimited = cooldownUntil !== null && cooldownSecondsRemaining > 0;

  useEffect(() => {
    if (cooldownUntil && cooldownSecondsRemaining === 0) {
      setCooldownUntil(null);
    }
  }, [cooldownUntil, cooldownSecondsRemaining]);

  useEffect(() => {
    if (currentSession) {
      setEditTitleValue(currentSession.title);
      // Restore the mode from the session's persona field
      if (currentSession.persona && ['explain', 'practice', 'upload'].includes(currentSession.persona)) {
        setMode(currentSession.persona as TutorMode);
      }
    }
  }, [currentSession?.id]); // Only re-run when session ID changes

  const handleNewChat = async () => {
    await createNewSession(mode);
    setShowQuickActions(true);
  };

  // Execute a tool call and return the result
  const executeToolCall = async (toolCall: ToolCall): Promise<ToolResult> => {
    const { name, arguments: argsStr } = toolCall.function;
    let args: any = {};
    
    try {
      args = JSON.parse(argsStr);
    } catch (e) {
      console.error('Failed to parse tool arguments:', e);
    }

    let result: any = { success: false, error: 'Unknown tool' };

    try {
      switch (name) {
        case 'add_task': {
          const task = await taskService.addTask(user?.id, args.name, args.estimated_pomodoros || 1);
          if (task) {
            result = { success: true, task_id: task.id, name: task.name, message: `Added topic "${task.name}"` };
          } else {
            result = { success: false, error: 'Failed to add task' };
          }
          break;
        }
        case 'get_tasks': {
          const tasks = await taskService.fetchTasks(user?.id);
          result = { 
            success: true, 
            tasks: tasks.map(t => ({ 
              id: t.id, 
              name: t.name, 
              completed: t.completed, 
              is_active: t.isActive,
              time_spent: t.timeSpent 
            }))
          };
          break;
        }
        case 'complete_task': {
          const success = await taskService.updateTaskCompletion(user?.id, args.task_id, true);
          result = { success, message: success ? 'Topic marked as complete' : 'Failed to complete task' };
          break;
        }
        case 'delete_task': {
          const success = await taskService.deleteTask(user?.id, args.task_id);
          result = { success, message: success ? 'Topic removed' : 'Failed to delete task' };
          break;
        }
        case 'set_active_task': {
          const success = await taskService.setActiveTask(user?.id, args.task_id);
          result = { success, message: success ? 'Active topic updated' : 'Failed to set active task' };
          break;
        }
        case 'add_subtask': {
          const subtask = await addSubTask(user?.id, args.parent_task_id, args.name);
          if (subtask) {
            result = { success: true, subtask_id: subtask.id, name: subtask.name, message: `Added sub-topic "${subtask.name}"` };
          } else {
            result = { success: false, error: 'Failed to add subtask' };
          }
          break;
        }
        case 'toggle_subtask': {
          // First fetch the subtask to get its current state, then toggle
          const { data: subtask } = await supabase
            .from('sub_tasks')
            .select('completed')
            .eq('id', args.subtask_id)
            .single();
          const newState = !(subtask?.completed ?? false);
          const success = await updateSubTaskCompletion(user?.id, args.subtask_id, newState);
          result = { success, message: success ? 'Sub-topic toggled' : 'Failed to toggle subtask' };
          break;
        }
        case 'delete_subtask': {
          const success = await deleteSubTask(user?.id, args.subtask_id);
          result = { success, message: success ? 'Sub-topic removed' : 'Failed to delete subtask' };
          break;
        }
        case 'start_timer':
        case 'pause_timer': {
          // These require dispatching events to the timer context - return success for now
          // The frontend will need to handle these via a custom event or context
          window.dispatchEvent(new CustomEvent('ai-timer-action', { detail: { action: name } }));
          result = { success: true, message: `Timer ${name === 'start_timer' ? 'started' : 'paused'}` };
          break;
        }
        default:
          result = { success: false, error: `Unknown tool: ${name}` };
      }
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error);
      result = { success: false, error: error instanceof Error ? error.message : 'Tool execution failed' };
    }

    return {
      tool_call_id: toolCall.id,
      role: 'tool',
      name,
      content: JSON.stringify(result)
    };
  };

  // Parse streaming response for content and tool calls
  const parseStreamChunk = (parsed: any, accumulated: { content: string; toolCalls: Map<number, ToolCall> }) => {
    const delta = parsed.choices?.[0]?.delta;
    
    if (delta?.content) {
      accumulated.content += delta.content;
    }
    
    if (delta?.tool_calls) {
      for (const tc of delta.tool_calls) {
        const index = tc.index ?? 0;
        if (!accumulated.toolCalls.has(index)) {
          accumulated.toolCalls.set(index, {
            id: tc.id || '',
            type: 'function',
            function: { name: '', arguments: '' }
          });
        }
        const existing = accumulated.toolCalls.get(index)!;
        if (tc.id) existing.id = tc.id;
        if (tc.function?.name) existing.function.name = tc.function.name;
        if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
      }
    }
    
    return accumulated;
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !user) return;
    if (inFlightSendRef.current) return;

    // A per-send request id to correlate frontend -> backend -> Gemini logs.
    const requestId = (globalThis.crypto?.randomUUID?.() ?? `req_${Date.now()}_${Math.random().toString(16).slice(2)}`);

    console.log('[tutor] handleSend called', {
      requestId,
      userId: user.id,
      mode,
      isLoading,
      isRateLimited,
      ts: new Date().toISOString(),
    });

    if (isRateLimited) {
      toast({
        title: 'Rate limit exceeded',
        description: `Rate limit exceeded. You can make 15 requests per minute. Please wait 60 seconds.`,
        variant: 'destructive',
      });
      return;
    }

    inFlightSendRef.current = true;

    const messageContent = inputValue.trim();
    setInputValue('');
    setShowQuickActions(false);
    setIsLoading(true);

    // Unlock background AI only after the user explicitly sends their first tutor message
    try {
      localStorage.setItem('syllabuddy_ai_enabled', 'true');
    } catch {
      // ignore
    }

    try {
      // Ensure we have a session
      let sessionId = currentSession?.id;
      if (!sessionId) {
        const newSession = await createNewSession(mode);
        if (!newSession) throw new Error('Failed to create session');
        sessionId = newSession.id;
      }

      // Capture the mode at send time so the message icon persists
      const messageMode = mode;

      // Add user message to UI immediately
      const tempUserMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: messageContent,
        created_at: new Date().toISOString(),
        mode: messageMode,
      };
      setMessages((prev) => [...prev, tempUserMessage]);

      // Save user message to DB with mode
      await supabase.from('coach_messages').insert({
        conversation_id: sessionId,
        user_id: user.id,
        role: 'user',
        content: messageContent,
        mode: messageMode,
      });

      // Get user's session token for edge function auth
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      // Prepare messages for AI, including tool messages from context
      const conversationMessages: AIMessage[] = [...messages, tempUserMessage].map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Fetch current tasks for context
      const tasks = await taskService.fetchTasks(user.id);
      const taskState = {
        tasks: tasks.map((t) => ({ id: t.id, name: t.name, is_active: t.isActive, completed: t.completed })),
      };

      let finalContent = '';

      const callAi = async () => {
        console.log('[tutor] invoking ai-coach', {
          requestId,
          conversationId: sessionId,
          messageChars: messageContent.length,
          ts: new Date().toISOString(),
        });

        return fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            request_id: requestId,
            messages: conversationMessages,
            mode,
            taskState,
          }),
        });
      };

      // One call per message. If Gemini is temporarily rate-limiting, retry ONCE after 5s
      // only when the backend doesn't instruct a longer wait.
      let response = await callAi();
      console.log('[tutor] ai-coach response', { requestId, status: response.status, ok: response.ok });

      if (response.status === 429) {
        const firstError = await response.json().catch(() => ({}));
        const retryAfterSeconds = Number(firstError?.retry_after_seconds ?? 0);

        console.warn('[tutor] rate limited (first attempt)', { requestId, retryAfterSeconds, firstError });

        // If backend suggests a long wait (typical free-tier RPM), do NOT retry after 5s.
        if (retryAfterSeconds > 5) {
          setCooldownUntil(Date.now() + 60_000);
          toast({
            title: 'Rate limit exceeded',
            description: 'Rate limit exceeded. You can make 15 requests per minute. Please wait 60 seconds.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        // Otherwise retry once after 5 seconds.
        await new Promise((r) => setTimeout(r, 5000));
        response = await callAi();
        console.log('[tutor] ai-coach response (retry)', { requestId, status: response.status, ok: response.ok });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('[tutor] ai-coach non-ok response', { requestId, status: response.status, errorData });

        // Handle specific error codes - directly open settings for API key issues
        if (errorData.code === 'NO_API_KEY' || errorData.code === 'INVALID_API_KEY') {
          props.onOpenSettings?.(); // Directly open settings drawer
          setIsLoading(false);
          return;
        }

        // Rate limit handling (Gemini free tier)
        if (response.status === 429 || errorData.code === 'RATE_LIMIT') {
          setCooldownUntil(Date.now() + 60_000);
          toast({
            title: 'Rate limit exceeded',
            description: 'Rate limit exceeded. You can make 15 requests per minute. Please wait 60 seconds.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        throw new Error(errorData.error || 'Failed to get response');
      }

      // Handle streaming response (single request)
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const accumulated = { content: '', toolCalls: new Map<number, ToolCall>(), ragSources: [] as RAGSource[] };
      const assistantMessageId = `temp-assistant-${Date.now()}`;

      // Add initial assistant message placeholder with current mode
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          created_at: new Date().toISOString(),
          sources: [],
          mode: messageMode,
        },
      ]);

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
              
              // Check for RAG sources event
              if (parsed.type === 'rag_sources' && parsed.sources) {
                accumulated.ragSources = parsed.sources;
                // Update message with sources
                queueMicrotask(() => {
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantMessageId ? { ...m, sources: parsed.sources } : m))
                  );
                });
                continue;
              }
              
              parseStreamChunk(parsed, accumulated);

              // Update UI with content as it streams
              if (accumulated.content) {
                finalContent = accumulated.content;
                queueMicrotask(() => {
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantMessageId ? { ...m, content: finalContent } : m))
                  );
                });
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }

      // Execute tool calls (if any) but DO NOT call the AI again.
      // This ensures one backend/Gemini call per user message.
      if (accumulated.toolCalls.size > 0) {
        console.log('Executing tool calls (no follow-up AI call):', Array.from(accumulated.toolCalls.values()));
        for (const toolCall of accumulated.toolCalls.values()) {
          try {
            await executeToolCall(toolCall);
          } catch (e) {
            console.warn('Tool execution failed:', e);
          }
        }
      }

      // Save final assistant message to DB with mode
      if (finalContent) {
        await supabase
          .from('coach_messages')
          .insert({
            conversation_id: sessionId,
            user_id: user.id,
            role: 'assistant',
            content: finalContent,
            mode: messageMode,
          });

        // Update session's last_message_at
        await supabase
          .from('coach_conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', sessionId);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      inFlightSendRef.current = false;
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (message: string) => {
    setInputValue(message);
    setTimeout(() => {
      handleSend();
    }, 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveTitle = () => {
    if (currentSession && editTitleValue.trim()) {
      updateSessionTitle(currentSession.id, editTitleValue.trim());
      setIsEditingTitle(false);
    }
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    if (currentSession) {
      setEditTitleValue(currentSession.title);
    }
  };

  // Send a hidden prompt to the AI (not shown as user message in chat)
  const sendHiddenPrompt = async (prompt: string, targetMode: TutorMode) => {
    if (isLoading || !user) return;
    if (inFlightSendRef.current) return;

    const requestId = (globalThis.crypto?.randomUUID?.() ?? `req_${Date.now()}_${Math.random().toString(16).slice(2)}`);
    
    inFlightSendRef.current = true;
    setShowQuickActions(false);
    setIsLoading(true);

    try {
      // Ensure we have a session
      let sessionId = currentSession?.id;
      if (!sessionId) {
        const newSession = await createNewSession(targetMode);
        if (!newSession) throw new Error('Failed to create session');
        sessionId = newSession.id;
      }

      // Get user's session token for edge function auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      // Prepare messages - include existing messages plus the hidden prompt
      const conversationMessages: AIMessage[] = [
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: prompt }
      ];

      // Fetch current tasks for context
      const tasks = await taskService.fetchTasks(user.id);
      const taskState = {
        tasks: tasks.map((t) => ({ id: t.id, name: t.name, is_active: t.isActive, completed: t.completed })),
      };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          messages: conversationMessages,
          mode: targetMode,
          taskState,
          isHiddenPrompt: true, // Signal to backend this is a mode-triggered prompt
        }),
      });

      if (response.status === 429) {
        setCooldownUntil(Date.now() + 60_000);
        toast({
          title: 'Rate limit exceeded',
          description: 'Please wait a moment before switching modes.',
          variant: 'destructive',
        });
        setIsLoading(false);
        inFlightSendRef.current = false;
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.code === 'NO_API_KEY' || errorData.code === 'INVALID_API_KEY') {
          props.onOpenSettings?.();
          setIsLoading(false);
          inFlightSendRef.current = false;
          return;
        }
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const accumulated = { content: '', toolCalls: new Map<number, ToolCall>(), ragSources: [] as RAGSource[] };
      const assistantMessageId = `temp-assistant-${Date.now()}`;

      // Add assistant message placeholder with the target mode
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          created_at: new Date().toISOString(),
          sources: [],
          mode: targetMode,
        },
      ]);

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
              
              if (parsed.type === 'rag_sources' && parsed.sources) {
                accumulated.ragSources = parsed.sources;
                queueMicrotask(() => {
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantMessageId ? { ...m, sources: parsed.sources } : m))
                  );
                });
                continue;
              }
              
              parseStreamChunk(parsed, accumulated);

              if (accumulated.content) {
                const contentSnapshot = accumulated.content;
                queueMicrotask(() => {
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantMessageId ? { ...m, content: contentSnapshot } : m))
                  );
                });
              }
            } catch {
              // Partial JSON, continue
            }
          }
        }
      }

      // Save assistant message to DB with mode
      if (accumulated.content) {
        await supabase.from('coach_messages').insert({
          conversation_id: sessionId,
          user_id: user.id,
          role: 'assistant',
          content: accumulated.content,
          mode: targetMode,
        });

        await supabase
          .from('coach_conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', sessionId);
      }

    } catch (error) {
      console.error('Error in sendHiddenPrompt:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      inFlightSendRef.current = false;
      setIsLoading(false);
    }
  };

  // Handle mode change - switch to mode-specific session for the current topic
  const handleModeChange = async (newMode: TutorMode) => {
    if (newMode === mode || isLoading) return;
    
    // For upload mode, just open the modal instead of changing mode
    if (newMode === 'upload') {
      setShowImageUploadModal(true);
      return;
    }
    
    // If we have an active topic, switch to the mode-specific session for that topic
    if (props.activeTopic) {
      setIsLoading(true);
      try {
        const session = await switchTopicModeSession(
          props.activeTopic.id,
          props.activeTopic.name,
          newMode
        );
        
        if (session) {
          setMode(newMode);
          
          // If switching to practice mode and no messages yet, trigger practice question
          if (newMode === 'practice' && messages.length === 0) {
            const topicContext = props.activeTopic.name ? `on the topic "${props.activeTopic.name}"` : '';
            const practicePrompt = `[PRACTICE MODE] Give me a practice question ${topicContext}. Use a past paper style question from the Edexcel A-Level Maths specification. Present the question clearly with all necessary information, and wait for my answer before providing any hints or solutions.`;
            await sendHiddenPrompt(practicePrompt, newMode);
          }
        }
      } catch (error) {
        console.error('Failed to switch mode session:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // No active topic - just update mode locally (for general chat)
      setMode(newMode);
      
      // Persist the mode to the database by updating the conversation's persona field
      if (currentSession) {
        try {
          await supabase
            .from('coach_conversations')
            .update({ persona: newMode })
            .eq('id', currentSession.id);
        } catch (error) {
          console.error('Failed to persist mode:', error);
        }
      }
      
      // Trigger AI action for practice mode - use activeTopic from props for better context
      if (newMode === 'practice') {
        const topicName = currentSession?.title && currentSession.title !== 'A-Level Maths Tutor' ? currentSession.title : '';
        const topicContext = topicName ? `on the topic "${topicName}"` : '';
        const practicePrompt = `[PRACTICE MODE] Give me a practice question ${topicContext}. Use a past paper style question from the Edexcel A-Level Maths specification. Present the question clearly with all necessary information, and wait for my answer before providing any hints or solutions.`;
        await sendHiddenPrompt(practicePrompt, newMode);
      }
    }
  };

  // Handle image upload submission
  const handleImageUpload = async (imageBase64: string, intent: ImageIntent) => {
    if (isLoading || !user) return;
    if (inFlightSendRef.current) return;

    const requestId = (globalThis.crypto?.randomUUID?.() ?? `req_${Date.now()}_${Math.random().toString(16).slice(2)}`);

    console.log('[tutor] handleImageUpload called', {
      requestId,
      userId: user.id,
      intent,
      ts: new Date().toISOString(),
    });

    setIsImageProcessing(true);
    inFlightSendRef.current = true;
    setShowQuickActions(false);

    try {
      // Ensure we have a session
      let sessionId = currentSession?.id;
      if (!sessionId) {
        const newSession = await createNewSession('upload');
        if (!newSession) throw new Error('Failed to create session');
        sessionId = newSession.id;
      }

      // Set mode to upload for this interaction
      setMode('upload');

      // Create user-facing message based on intent
      const userMessageContent = intent === 'help' 
        ? '[Uploaded an image] Help me solve this question'
        : '[Uploaded an image] Check my working on this question';

      // Add user message to UI
      const tempUserMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: userMessageContent,
        created_at: new Date().toISOString(),
        mode: 'upload',
      };
      setMessages((prev) => [...prev, tempUserMessage]);

      // Save user message to DB
      await supabase.from('coach_messages').insert({
        conversation_id: sessionId,
        user_id: user.id,
        role: 'user',
        content: userMessageContent,
        mode: 'upload',
      });

      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      // Fetch current tasks for context
      const tasks = await taskService.fetchTasks(user.id);
      const taskState = {
        tasks: tasks.map((t) => ({ id: t.id, name: t.name, is_active: t.isActive, completed: t.completed })),
      };

      // Call AI with image
      setIsLoading(true);
      setShowImageUploadModal(false);
      setIsImageProcessing(false);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          messages: [...messages, tempUserMessage].map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          mode: 'upload',
          taskState,
          imageData: imageBase64,
          imageIntent: intent,
        }),
      });

      if (response.status === 429) {
        setCooldownUntil(Date.now() + 60_000);
        toast({
          title: 'Rate limit exceeded',
          description: 'Please wait a moment before trying again.',
          variant: 'destructive',
        });
        setIsLoading(false);
        inFlightSendRef.current = false;
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.code === 'NO_API_KEY' || errorData.code === 'INVALID_API_KEY') {
          props.onOpenSettings?.();
          setIsLoading(false);
          inFlightSendRef.current = false;
          return;
        }
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const accumulated = { content: '', toolCalls: new Map<number, ToolCall>(), ragSources: [] as RAGSource[] };
      const assistantMessageId = `temp-assistant-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          created_at: new Date().toISOString(),
          sources: [],
          mode: 'upload',
        },
      ]);

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
              
              if (parsed.type === 'rag_sources' && parsed.sources) {
                accumulated.ragSources = parsed.sources;
                queueMicrotask(() => {
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantMessageId ? { ...m, sources: parsed.sources } : m))
                  );
                });
                continue;
              }
              
              parseStreamChunk(parsed, accumulated);

              if (accumulated.content) {
                const contentSnapshot = accumulated.content;
                queueMicrotask(() => {
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantMessageId ? { ...m, content: contentSnapshot } : m))
                  );
                });
              }
            } catch {
              // Partial JSON, continue
            }
          }
        }
      }

      // Save assistant message to DB
      if (accumulated.content) {
        await supabase.from('coach_messages').insert({
          conversation_id: sessionId,
          user_id: user.id,
          role: 'assistant',
          content: accumulated.content,
          mode: 'upload',
        });

        await supabase
          .from('coach_conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', sessionId);
      }

    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process image',
        variant: 'destructive',
      });
      setShowImageUploadModal(false);
      setIsImageProcessing(false);
    } finally {
      inFlightSendRef.current = false;
      setIsLoading(false);
    }
  };

  // Format time for display
  const formatStudyTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Active Topic Card - Shows when a topic is selected */}
      {props.activeTopic && (
        <div className="flex-shrink-0 mx-4 mt-3">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{props.activeTopic.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {/* Use getTopicTotalTime for reactive updates when timer is running */}
                    {formatStudyTime(getTopicTotalTime(props.activeTopic.id))}
                  </span>
                  {props.activeTopic.completedSubtopics.length > 0 && (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      {props.activeTopic.completedSubtopics.length} complete
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode Selection */}
      <div className="flex-shrink-0 px-4 py-3">
        <div className="flex gap-1.5">
          <Button
            onClick={() => handleModeChange('explain')}
            variant={mode === 'explain' ? 'default' : 'outline'}
            size="sm"
            className="flex-1 px-2 min-w-0"
            disabled={isLoading}
          >
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            <span className="ml-1.5 truncate hidden sm:inline">Explain</span>
          </Button>
          <Button
            onClick={() => handleModeChange('practice')}
            variant={mode === 'practice' ? 'default' : 'outline'}
            size="sm"
            className="flex-1 px-2 min-w-0"
            disabled={isLoading}
          >
            <PenTool className="w-4 h-4 flex-shrink-0" />
            <span className="ml-1.5 truncate hidden sm:inline">Practice</span>
          </Button>
          <Button
            onClick={() => handleModeChange('upload')}
            variant="outline"
            size="sm"
            className="flex-1 px-2 min-w-0"
            disabled={isLoading}
          >
            <ImagePlus className="w-4 h-4 flex-shrink-0" />
            <span className="ml-1.5 truncate hidden sm:inline">Upload</span>
          </Button>
        </div>
      </div>

      {/* Messages - Scrollable */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground mt-8 px-4">
            {mode === 'practice' ? (
              <>
                <PenTool className="w-16 h-16 mx-auto mb-4 text-primary/50" />
                <h4 className="text-lg font-semibold mb-2">Practice Mode</h4>
                <p className="mb-4">I'll give you past paper questions to work through.</p>
                <div className="text-sm text-left bg-muted/50 rounded-lg p-4 max-w-md mx-auto">
                  <p className="font-medium mb-2">How it works:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Select a topic from the curriculum</li>
                    <li>I'll provide exam-style questions</li>
                    <li>Work through them at your own pace</li>
                    <li>Use Upload mode to check your handwritten answers</li>
                  </ul>
                  <p className="mt-3 text-xs italic">Try asking: "Give me a quadratics question" or "Practice integration by parts"</p>
                </div>
              </>
            ) : mode === 'upload' ? (
              <>
                <ImagePlus className="w-16 h-16 mx-auto mb-4 text-primary/50" />
                <h4 className="text-lg font-semibold mb-2">Upload Mode</h4>
                <p className="mb-4">Upload a photo of a maths question for guidance or verification.</p>
                <div className="text-sm text-left bg-muted/50 rounded-lg p-4 max-w-md mx-auto">
                  <p className="font-medium mb-2">You can:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Upload a question from a past paper or textbook</li>
                    <li>Get step-by-step guidance on how to solve it</li>
                    <li>Submit your handwritten working for review</li>
                    <li>Get feedback on where you went wrong</li>
                  </ul>
                  <p className="mt-3 text-xs italic">Click the Upload button above to get started!</p>
                </div>
              </>
            ) : props.activeTopic ? (
              // Topic-specific overview when a topic is selected
              (() => {
                const overview = getTopicOverview(props.activeTopic.id);
                return (
                  <>
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-primary/50" />
                    <h4 className="text-lg font-semibold mb-2">{overview?.title || props.activeTopic.name}</h4>
                    <p className="mb-4 text-foreground/80">{overview?.description || `Let's explore ${props.activeTopic.name} together.`}</p>
                    {overview && (
                      <div className="text-sm text-left bg-muted/50 rounded-lg p-4 max-w-md mx-auto">
                        <p className="font-medium mb-2">Key concepts you'll learn:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {overview.keyPoints.map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                        {overview.examTip && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs flex items-start gap-1.5">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                              <span><span className="font-medium">Exam tip:</span> {overview.examTip}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()
            ) : (
              <>
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-primary/50" />
                <h4 className="text-lg font-semibold mb-2">Welcome to your A-Level Maths Tutor!</h4>
                <p className="mb-4">I'm here to help you master the Edexcel A-Level Maths curriculum.</p>
                <div className="text-sm text-left bg-muted/50 rounded-lg p-4 max-w-md mx-auto">
                  <p className="font-medium mb-2">I can help you with:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Pure Mathematics (Algebra, Calculus, Trigonometry)</li>
                    <li>Statistics & Probability</li>
                    <li>Mechanics</li>
                    <li>Problem-solving techniques</li>
                  </ul>
                  <p className="mt-3 text-xs italic">I'll guide you through problems step-by-step, helping you learn rather than just giving answers.</p>
                </div>
              </>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <MathsMessage key={message.id} message={message} mode={message.mode || 'explain'} />
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
              {mode === 'practice' ? (
                <PenTool className="w-5 h-5 text-primary-foreground" />
              ) : mode === 'upload' ? (
                <ImagePlus className="w-5 h-5 text-primary-foreground" />
              ) : (
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              )}
            </div>
            <div className="bg-muted rounded-xl px-4 py-3 max-w-[85%]">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions - Show subtopics when topic is active, otherwise generic starters */}
      {showQuickActions && messages.length === 0 && (
        <div className="flex-shrink-0 px-4 pb-3 flex flex-wrap gap-2">
          {props.activeTopic && props.activeTopic.subtopics.length > 0 ? (
            // Show subtopics for the current topic
            props.activeTopic.subtopics.slice(0, 6).map((subtopic) => {
              const isCompleted = props.activeTopic?.completedSubtopics.includes(subtopic);
              return (
                <Button
                  key={subtopic}
                  onClick={() => {
                    // Mark subtopic as in-progress/tracked
                    props.onSubtopicClick?.(subtopic);
                    // Send as conversation starter
                    handleQuickAction(`Help me understand ${subtopic}`);
                  }}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "text-xs gap-1.5",
                    isCompleted && "bg-green-50 dark:bg-green-950/30 border-green-500/50 text-green-700 dark:text-green-400"
                  )}
                  disabled={isLoading}
                >
                  {isCompleted && <Check className="h-3 w-3" />}
                  {subtopic}
                </Button>
              );
            })
          ) : (
            // Fallback: generic quick actions when no topic is active
            <>
              <Button
                onClick={() => handleQuickAction("I need help solving a quadratic equation")}
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={isLoading}
              >
                Quadratics
              </Button>
              <Button
                onClick={() => handleQuickAction("Can you explain differentiation step by step?")}
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={isLoading}
              >
                Differentiation
              </Button>
              <Button
                onClick={() => handleQuickAction("I'm struggling with integration by parts")}
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={isLoading}
              >
                Integration
              </Button>
              <Button
                onClick={() => handleQuickAction("Give me a practice problem on trigonometry")}
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={isLoading}
              >
                Trigonometry
              </Button>
            </>
          )}
        </div>
      )}

      {/* Input - Fixed at bottom (optionally portaled to parent grid) */}
      {(() => {
        const inputEl = (
          <div className="flex-shrink-0 px-4 py-4 bg-background/80">
            {isRateLimited && (
              <div className="mb-3 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                Rate limit exceeded. Try again in <span className="font-medium text-foreground">{cooldownSecondsRemaining}s</span>.
              </div>
            )}
            <div className="flex gap-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question or paste a problem..."
                disabled={isLoading || isRateLimited}
                className="flex-1 h-12 text-base"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading || isRateLimited}
                size="icon"
                className="h-12 w-12"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        );

        if (props.inputPortalTarget) {
          return createPortal(inputEl, props.inputPortalTarget);
        }
        return inputEl;
      })()}

      {/* Image Upload Modal */}
      <ImageUploadModal
        open={showImageUploadModal}
        onOpenChange={setShowImageUploadModal}
        onSubmit={handleImageUpload}
        isLoading={isImageProcessing}
      />
    </div>
  );
});

MathsTutorInterface.displayName = 'MathsTutorInterface';

export default MathsTutorInterface;
