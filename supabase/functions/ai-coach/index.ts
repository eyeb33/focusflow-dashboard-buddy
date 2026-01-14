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
    const { messages, trigger, triggerContext, timerState, taskState, mode = 'explain' } = await req.json();
    
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

    console.log('Maths tutor request from user:', user.id, 'mode:', mode, 'trigger:', trigger);

    // Gather user context for study tracking
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const today = new Date().toISOString().split('T')[0];

    const [sessionsResult, tasksResult, streakResult] = await Promise.all([
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
        .from('sessions_summary')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()
    ]);

    const recentSessions = sessionsResult.data || [];
    const activeTasks = tasksResult.data || [];
    const todayStats = streakResult.data || { total_completed_sessions: 0, total_focus_time: 0 };

    // Calculate context
    const completedToday = todayStats.total_completed_sessions || 0;
    const focusTimeToday = todayStats.total_focus_time || 0;
    const activeStudyTopic =
      (taskState?.tasks?.find((t: any) => t.is_active)?.name) ||
      ((activeTasks as any[]).find((t: any) => t.is_active)?.name) ||
      triggerContext?.taskName ||
      'No active topic';
    const pendingTopicsCount = taskState?.tasks?.length ?? activeTasks.length;

    // Build system prompt with mode-specific behavior
    const activeTask = taskState?.tasks?.find((t: any) => t.is_active);
    
    // Mode-specific tutoring approaches
    const modePrompts = {
      explain: {
        intro: `You are an expert A-Level Mathematics tutor specializing in the AQA specification. Your role is to EXPLAIN concepts clearly and help students understand mathematical principles deeply.`,
        style: `Your teaching style in EXPLAIN mode:
1. Break down complex concepts into simple, digestible steps
2. Use the Socratic method - ask guiding questions to help students discover answers
3. NEVER give direct answers immediately - guide the student to understanding
4. Provide clear explanations with examples
5. Connect new concepts to what the student already knows
6. Use mathematical notation with LaTeX: inline $x^2$ and display $$\\frac{d}{dx}[x^n] = nx^{n-1}$$
7. Reference relevant AQA specification topics when helpful
8. Be encouraging but maintain academic rigor`
      },
      practice: {
        intro: `You are an expert A-Level Mathematics tutor specializing in the AQA specification. Your role is to generate PRACTICE problems and guide students through solving them independently.`,
        style: `Your teaching style in PRACTICE mode:
1. Generate appropriate practice problems matching AQA exam style
2. Start with the problem, then wait for the student's attempt
3. Provide hints rather than solutions when students are stuck
4. Grade difficulty appropriately (state if it's C1/C2/C3/C4 level or equivalent)
5. After they solve it, offer a similar problem for reinforcement
6. Use proper mathematical notation with LaTeX
7. Celebrate correct answers and explain any errors kindly
8. Mix problem types to build comprehensive understanding`
      },
      check: {
        intro: `You are an expert A-Level Mathematics tutor specializing in the AQA specification. Your role is to CHECK the student's working and help them identify and correct any errors.`,
        style: `Your teaching style in CHECK mode:
1. Carefully review all working shown by the student
2. Identify specific errors and explain WHY they're wrong
3. Point out correct steps before addressing errors
4. Don't just give the right answer - explain the correct method
5. Check for common mistakes (sign errors, forgotten constants, etc.)
6. Verify the final answer makes sense in context
7. Suggest better methods if there's a more elegant solution
8. Be supportive - mistakes are learning opportunities`
      }
    };
    
    const currentMode = modePrompts[mode as keyof typeof modePrompts] || modePrompts.explain;
    
    let systemPrompt = `${currentMode.intro}

## AQA A-Level Maths Curriculum Coverage

You are an expert in ALL areas of the AQA A-Level Mathematics specification:

**Pure Mathematics:**
- Proof (mathematical argument and notation)
- Algebra and functions (quadratics, polynomials, partial fractions)
- Coordinate geometry (straight lines, circles, parametric equations)
- Sequences and series (arithmetic, geometric, sigma notation, binomial expansion)
- Trigonometry (identities, equations, inverse functions, radians)
- Exponentials and logarithms
- Differentiation (chain rule, product rule, quotient rule, implicit, parametric)
- Integration (by parts, substitution, partial fractions, volumes of revolution)
- Numerical methods (Newton-Raphson, trapezium rule)
- Vectors (2D and 3D)

**Statistics:**
- Statistical sampling
- Data presentation and interpretation
- Probability (conditional, independent events, tree diagrams)
- Statistical distributions (binomial, normal)
- Statistical hypothesis testing

**Mechanics:**
- Quantities and units in mechanics
- Kinematics (constant acceleration, projectiles)
- Forces and Newton's laws
- Moments

${activeTask ? `📚 CURRENT STUDY TOPIC: "${activeTask.name}"
${activeTask.sub_tasks?.length > 0 ? `   Sub-topics: ${activeTask.sub_tasks.map((st: any) => `"${st.name}"${st.completed ? ' ✓' : ''}`).join(', ')}` : ''}

Focus your tutoring on this topic when relevant.

` : ''}${taskState && taskState.tasks?.length > 0 ? `Study Topics (can be managed via tools):
${taskState.tasks.map((t: any, i: number) => {
  let topicInfo = `${i + 1}. "${t.name}" → ID: ${t.id}${t.is_active ? ' (CURRENT)' : ''}`;
  if (t.sub_tasks && t.sub_tasks.length > 0) {
    topicInfo += ` [${t.sub_tasks.filter((st: any) => st.completed).length}/${t.sub_tasks.length} complete]`;
  }
  return topicInfo;
}).join('\n')}
` : ''}
Current Study Session:
- Study Sessions Today: ${completedToday}
- Total Study Time Today: ${focusTimeToday} minutes
- Pending Topics: ${pendingTopicsCount}

${timerState ? `Study Timer Status:
- Running: ${timerState.isRunning ? 'Yes' : 'No'}
- Mode: ${timerState.mode === 'work' ? 'Study' : timerState.mode === 'break' ? 'Short Break' : 'Long Break'}
- Time Remaining: ${Math.floor(timerState.timeRemaining / 60)}m ${timerState.timeRemaining % 60}s` : ''}

## CRITICAL TUTORING RULES

1. **Never give direct answers** - Guide students to discover solutions themselves
2. **Use LaTeX for ALL mathematical expressions**:
   - Inline: $x^2 + 5x + 6$
   - Display: $$\\int_0^1 x^2 \\, dx = \\frac{1}{3}$$
3. **Break problems into steps** - One concept at a time
4. **Ask questions** - "What do you think the next step would be?" "Can you see a pattern here?"
5. **Encourage attempts** - "Have a go at this part, and I'll help if you get stuck"
6. **Be patient** - Students learn at different paces
7. **Connect to exams** - Mention mark schemes and common exam approaches when relevant

${currentMode.style}

## Available Tools (for study management)
- get_tasks(): Get current study topics
- add_task(name): Add a new study topic
- complete_task(task_id): Mark topic as mastered
- delete_task(task_id): Remove a topic
- add_subtask(parent_task_id, name): Add a sub-topic
- toggle_subtask(subtask_id): Mark sub-topic complete
- start_timer(): Start study timer
- pause_timer(): Pause study timer
- set_active_task(task_id): Set current study topic`;

    // Add trigger-specific context
    if (trigger === 'pomodoro_cycle_complete') {
      systemPrompt += `\n\nThe student just completed a full study cycle. Congratulate them and suggest reviewing what they've learned or taking a proper break.`;
    } else if (trigger === 'task_completed') {
      systemPrompt += `\n\nThe student just completed a study topic${triggerContext?.taskName ? ` called "${triggerContext.taskName}"` : ''}. Celebrate this achievement and suggest what to study next.`;
    } else if (trigger === 'first_interaction') {
      systemPrompt += `\n\nThis is the student's first interaction. Welcome them warmly, introduce yourself as their A-Level Maths tutor, and ask what topic they'd like help with today. Mention you cover the full AQA specification.`;
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
          description: "Add a new study topic to the student's list",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "The topic name (e.g., 'Integration by Parts', 'Normal Distribution')" },
              estimated_pomodoros: { type: "integer", description: "Estimated study sessions needed (default: 1)", default: 1 }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "complete_task",
          description: "Mark a study topic as mastered/completed",
          parameters: {
            type: "object",
            properties: {
              task_id: { type: "string", description: "The UUID of the topic to complete" }
            },
            required: ["task_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "start_timer",
          description: "Start the study timer for a focused session",
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
          description: "Pause the study timer",
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
          description: "Set which topic the student is currently studying",
          parameters: {
            type: "object",
            properties: {
              task_id: { type: "string", description: "The UUID of the topic to focus on" }
            },
            required: ["task_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "delete_task",
          description: "Remove a study topic",
          parameters: {
            type: "object",
            properties: {
              task_id: { type: "string", description: "The UUID of the topic to delete" }
            },
            required: ["task_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_tasks",
          description: "Get the current list of study topics",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function",
        function: {
          name: "add_subtask",
          description: "Add a sub-topic to a study topic",
          parameters: {
            type: "object",
            properties: {
              parent_task_id: { type: "string", description: "The UUID of the parent topic" },
              name: { type: "string", description: "The sub-topic name" }
            },
            required: ["parent_task_id", "name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "delete_subtask",
          description: "Remove a sub-topic",
          parameters: {
            type: "object",
            properties: {
              subtask_id: { type: "string", description: "The UUID of the sub-topic to delete" }
            },
            required: ["subtask_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "toggle_subtask",
          description: "Toggle a sub-topic's completion status",
          parameters: {
            type: "object",
            properties: {
              subtask_id: { type: "string", description: "The UUID of the sub-topic to toggle" }
            },
            required: ["subtask_id"]
          }
        }
      }
    ];

    const sanitizedMessages = (messages || []).map((msg: any) => {
      if (typeof msg.content === 'string') {
        return {
          ...msg,
          content: msg.content.replace(/get_active_task/gi, 'current topic')
        };
      }
      return msg;
    });

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
          ...sanitizedMessages.map((msg: any) => {
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
