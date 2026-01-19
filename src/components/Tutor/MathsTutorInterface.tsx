import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Send, GraduationCap, BookOpen, PenTool, CheckCircle, Plus, Pencil, Check, X, Settings, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import MathsMessage from './MathsMessage';
import ChatSessionDrawer from './ChatSessionDrawer';
import SettingsDrawer from '@/components/Settings/SettingsDrawer';
import ApiStatsDrawer from './ApiStatsDrawer';
import { useChatSessions, ChatMessage } from '@/hooks/useChatSessions';
import * as taskService from '@/services/taskService';
import { fetchSubTasks, addSubTask, updateSubTaskCompletion, deleteSubTask } from '@/services/subTaskService';

type TutorMode = 'explain' | 'practice' | 'check';

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
  openTaskSession: (taskId: string, taskName: string) => Promise<void>;
  linkedTaskIds: Set<string>;
}

interface MathsTutorInterfaceProps {
  // Optional props for future use
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
    linkedTaskIds,
  } = useChatSessions();

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<TutorMode>('explain');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showApiStats, setShowApiStats] = useState(false);

  // Hard lock to prevent double-submits (Enter + click, double-click, etc.)
  const inFlightSendRef = useRef(false);

  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState(() => Date.now());

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Expose openTaskSession and linkedTaskIds via ref for parent components
  useImperativeHandle(ref, () => ({
    openTaskSession: async (taskId: string, taskName: string) => {
      await openTaskSession(taskId, taskName);
    },
    linkedTaskIds
  }), [openTaskSession, linkedTaskIds]);

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
    }
  }, [currentSession]);

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

      // Add user message to UI immediately
      const tempUserMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: messageContent,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMessage]);

      // Save user message to DB
      await supabase.from('coach_messages').insert({
        conversation_id: sessionId,
        user_id: user.id,
        role: 'user',
        content: messageContent,
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
          setShowSettings(true); // Directly open settings drawer
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
      const accumulated = { content: '', toolCalls: new Map<number, ToolCall>() };
      const assistantMessageId = `temp-assistant-${Date.now()}`;

      // Add initial assistant message placeholder
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          created_at: new Date().toISOString(),
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

      // Save final assistant message to DB
      if (finalContent) {
        await supabase
          .from('coach_messages')
          .insert({
            conversation_id: sessionId,
            user_id: user.id,
            role: 'assistant',
            content: finalContent,
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

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 border-b border-border bg-primary/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editTitleValue}
                    onChange={(e) => setEditTitleValue(e.target.value)}
                    className="h-7 text-sm font-bold"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') handleCancelEditTitle();
                    }}
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveTitle}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancelEditTitle}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base truncate">
                      {currentSession?.title || 'A-Level Maths Tutor'}
                    </h3>
                    {currentSession && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => setIsEditingTitle(true)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {currentSession?.linked_task_id ? (
                    <p className="text-xs text-primary font-medium">
                      Currently studying: {currentSession.title}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Edexcel Specification</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleNewChat}
              title="New chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowApiStats(true)}
              title="API Stats"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <ChatSessionDrawer
              sessions={sessions}
              currentSessionId={currentSession?.id || null}
              onSelectSession={switchSession}
              onDeleteSession={deleteSession}
              onUpdateTitle={updateSessionTitle}
              isLoading={isLoadingSessions}
            />
          </div>
        </div>
        
        
        {/* Mode Selection */}
        <div className="flex gap-2">
          <Button
            onClick={() => setMode('explain')}
            variant={mode === 'explain' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Explain
          </Button>
          <Button
            onClick={() => setMode('practice')}
            variant={mode === 'practice' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
          >
            <PenTool className="w-4 h-4 mr-2" />
            Practice
          </Button>
          <Button
            onClick={() => setMode('check')}
            variant={mode === 'check' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Check
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
            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-primary/50" />
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
          </div>
        ) : (
          messages.map((message) => (
            <MathsMessage key={message.id} message={message} />
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
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

      {/* Quick Actions */}
      {showQuickActions && messages.length === 0 && (
        <div className="flex-shrink-0 px-4 pb-3 flex flex-wrap gap-2">
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
        </div>
      )}

      {/* Input - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-background/80">
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
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Tip: Use $ for inline maths like $x^2$ and $$ for display equations
        </p>
      </div>
      
      {/* Settings Drawer */}
      <SettingsDrawer open={showSettings} onOpenChange={setShowSettings} />
      
      {/* API Stats Drawer */}
      <ApiStatsDrawer 
        open={showApiStats} 
        onOpenChange={setShowApiStats}
        onOpenSettings={() => setShowSettings(true)}
      />
    </div>
  );
});

MathsTutorInterface.displayName = 'MathsTutorInterface';

export default MathsTutorInterface;
