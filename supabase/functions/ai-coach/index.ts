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

Current Context:
- Active Task: ${activeTaskName}
- Completed Sessions Today: ${completedToday}
- Total Focus Time Today: ${focusTimeToday} minutes
- Tasks Pending: ${pendingTasksCount}
${lastMood ? `- Recent Mood: ${lastMood}/5` : ''}

${timerState ? `Timer Status:
- State: ${timerState.isRunning ? 'Running' : 'Paused'}
- Mode: ${timerState.mode}
- Time Remaining: ${Math.floor(timerState.timeRemaining / 60)} minutes ${timerState.timeRemaining % 60} seconds
- Current Session: ${timerState.currentSessionIndex + 1} of ${timerState.sessionsUntilLongBreak}` : ''}

${taskState && taskState.tasks?.length > 0 ? `Current Tasks:
${taskState.tasks.map((t: any, i: number) => `${i + 1}. ${t.name}${t.is_active ? ' (ACTIVE)' : ''}${t.completed ? ' ✓' : ''} - ${t.estimated_pomodoros} pomodoros`).join('\n')}` : ''}

Your capabilities:
- You can ADD tasks to the user's list
- You can COMPLETE tasks
- You can START and PAUSE the timer
- You can SET which task is active

Your approach:
1. Be warm, encouraging, and concise (2-3 sentences max)
2. Use your tools to help users take action
3. When users mention tasks, offer to add them
4. Suggest starting the timer for focus work
5. Celebrate wins and acknowledge effort
6. Ask about wellbeing periodically
7. Use emojis sparingly but effectively`;

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
          ...messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }))
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
