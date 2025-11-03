import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, trigger, triggerContext, timerState, taskState } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Coach request from user:', user.id, 'trigger:', trigger);

    // Gather user context
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const today = new Date().toISOString().split('T')[0];

    const [sessionsResult, tasksResult, checkInsResult, streakResult] = await Promise.all([
      supabaseClient
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', last7Days)
        .order('created_at', { ascending: false })
        .limit(20),
      
      supabaseClient
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .limit(10),
      
      supabaseClient
        .from('coach_check_ins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      
      supabaseClient
        .from('sessions_summary')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()
    ]);

    const recentSessions = sessionsResult.data || [];
    const activeTasks = tasksResult.data || [];
    const recentCheckIns = checkInsResult.data || [];
    const todayStats = streakResult.data || { total_completed_sessions: 0, total_focus_time: 0 };

    // Calculate context
    const completedToday = todayStats.total_completed_sessions || 0;
    const focusTimeToday = todayStats.total_focus_time || 0;
    const activeTaskName = triggerContext?.taskName || (activeTasks[0]?.name || 'No active task');
    const pendingTasksCount = activeTasks.length;
    const lastMood = recentCheckIns[0]?.mood_rating || null;

    // Build system prompt with real-time state
    let systemPrompt = `You are a supportive wellbeing and productivity coach with direct control over the user's Pomodoro timer and task list.

CRITICAL INSTRUCTIONS FOR TASK HANDLING:

${taskState && taskState.tasks?.length > 0 ? `Current Task List (WITH IDs):
${taskState.tasks.map((t: any, i: number) => `${i + 1}. "${t.name}" → ID: ${t.id}${t.is_active ? ' (ACTIVE)' : ''}`).join('\n')}

WHEN USERS MENTION TASKS BY NAME:
- If they say "complete [task name]" → Look up the task_id from the list above by matching the name, then call complete_task with that ID
- If they say "work on [task name]" → Look up the task_id and call set_active_task with that ID
- NEVER ask users for task IDs - YOU can see them in the list above
- Use fuzzy matching (partial names are okay if unambiguous)
- Only ask for clarification if multiple tasks match` : 'User has no tasks yet.'}

WHEN ADDING NEW TASKS:
- If user says "add task [name]" or mentions doing something new → Just call add_task immediately
- Don't ask for confirmation, just do it and confirm afterwards

Current Context:
- Active Task: ${activeTaskName}
- Completed Sessions Today: ${completedToday}
- Total Focus Time Today: ${focusTimeToday} minutes
- Pending Tasks: ${pendingTasksCount}
${lastMood ? `- Recent Mood: ${lastMood}/5` : ''}

${timerState ? `Timer Status:
- Running: ${timerState.isRunning ? 'Yes' : 'No'}
- Mode: ${timerState.mode}
- Time Left: ${Math.floor(timerState.timeRemaining / 60)}m ${timerState.timeRemaining % 60}s
- Session: ${timerState.currentSessionIndex + 1}/${timerState.sessionsUntilLongBreak}` : ''}

Your capabilities:
- get_tasks(): Retrieve current task list (use when user asks about tasks)
- add_task(name, estimated_pomodoros): Create task
- complete_task(task_id): Mark done
- delete_task(task_id): Remove/delete task
- start_timer(): Start timer
- pause_timer(): Pause timer  
- set_active_task(task_id): Set working task

Your style:
1. Act immediately on clear requests - don't ask for IDs or confirmations
2. Be warm and concise (2-3 sentences)
3. Match task names intelligently from the list above
4. Celebrate wins and encourage progress`;

    // Add trigger-specific context
    if (trigger === 'pomodoro_cycle_complete') {
      systemPrompt += `\n\nThe user just completed a full Pomodoro cycle (4 sessions). Congratulate them and ask how they're feeling.`;
    } else if (trigger === 'extended_work_detected') {
      systemPrompt += `\n\nThe user has been working for over 2 hours. Gently suggest taking a longer break.`;
    } else if (trigger === 'task_completed') {
      systemPrompt += `\n\nThe user just completed a task${triggerContext?.taskName ? ` called "${triggerContext.taskName}"` : ''}. Celebrate this achievement and ask what's next.`;
    } else if (trigger === 'first_interaction') {
      systemPrompt += `\n\nThis is the user's first interaction with you. Introduce yourself warmly and ask how their day is going.`;
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Define available tools for the AI
    const tools = [
      {
        type: "function",
        function: {
          name: "add_task",
          description: "Add a new task to the user's task list",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "The task name" },
              estimated_pomodoros: { type: "integer", description: "Estimated number of pomodoros (default: 1)", default: 1 }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "complete_task",
          description: "Mark a task as completed",
          parameters: {
            type: "object",
            properties: {
              task_id: { type: "string", description: "The UUID of the task to complete" }
            },
            required: ["task_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "start_timer",
          description: "Start the Pomodoro timer",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function",
        function: {
          name: "pause_timer",
          description: "Pause the Pomodoro timer",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function",
        function: {
          name: "set_active_task",
          description: "Set which task the user is currently working on",
          parameters: {
            type: "object",
            properties: {
              task_id: { type: "string", description: "The UUID of the task to set as active, or null to clear" }
            },
            required: ["task_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "delete_task",
          description: "Delete/remove a task from the user's task list",
          parameters: {
            type: "object",
            properties: {
              task_id: { type: "string", description: "The UUID of the task to delete" }
            },
            required: ["task_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_tasks",
          description: "Get the current task list. Use this when the user asks about their tasks or wants to know what tasks they have.",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      }
    ];

    // Call Lovable AI with tools
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((msg: any) => {
            // Preserve tool_calls and tool information for proper conversation context
            const mappedMsg: any = {
              role: msg.role,
              content: msg.content || ''
            };
            
            if (msg.tool_calls) {
              mappedMsg.tool_calls = msg.tool_calls;
            }
            
            if (msg.tool_call_id) {
              mappedMsg.tool_call_id = msg.tool_call_id;
              mappedMsg.name = msg.name;
            }
            
            return mappedMsg;
          })
        ],
        tools,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: "I'm getting a lot of requests right now. Let's try again in a moment." 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: "AI service credits depleted. Please add funds to your workspace." 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error('AI gateway error');
    }

    // Stream the response
    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Error in ai-coach function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
