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

    // Fetch user's Gemini API key from profile
    const { data: profileData } = await supabaseClient
      .from('profiles')
      .select('gemini_api_key')
      .eq('user_id', user.id)
      .single();

    const userGeminiApiKey = profileData?.gemini_api_key;
    
    if (!userGeminiApiKey) {
      return new Response(JSON.stringify({ 
        error: "No Gemini API key configured. Please add your API key in Settings to use the AI tutor.",
        code: "NO_API_KEY"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
        intro: `You are an expert A-Level Mathematics tutor specializing in the Edexcel specification. Your role is to EXPLAIN concepts clearly and help students understand mathematical principles deeply.`,
        style: `Your teaching style in EXPLAIN mode:
1. Break down complex concepts into simple, digestible steps
2. Use the Socratic method - ask guiding questions to help students discover answers
3. NEVER give direct answers immediately - guide the student to understanding
4. Provide clear explanations with examples
5. Connect new concepts to what the student already knows
6. Use mathematical notation with LaTeX: inline $x^2$ and display $$\\frac{d}{dx}[x^n] = nx^{n-1}$$
7. Reference relevant Edexcel specification topics when helpful
8. Be encouraging but maintain academic rigor`
      },
      practice: {
        intro: `You are an expert A-Level Mathematics tutor specializing in the Edexcel specification. Your role is to generate PRACTICE problems and guide students through solving them independently.`,
        style: `Your teaching style in PRACTICE mode:
1. Generate appropriate practice problems matching Edexcel exam style
2. Start with the problem, then wait for the student's attempt
3. Provide hints rather than solutions when students are stuck
4. Grade difficulty appropriately (state if it's Pure 1/2, Stats 1, Mechanics 1 level)
5. After they solve it, offer a similar problem for reinforcement
6. Use proper mathematical notation with LaTeX
7. Celebrate correct answers and explain any errors kindly
8. Mix problem types to build comprehensive understanding`
      },
      check: {
        intro: `You are an expert A-Level Mathematics tutor specializing in the Edexcel specification. Your role is to CHECK the student's working and help them identify and correct any errors.`,
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

## Edexcel A-Level Maths Curriculum Coverage

You are an expert in ALL areas of the Edexcel A-Level Mathematics specification:

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
      systemPrompt += `\n\nThis is the student's first interaction. Welcome them warmly, introduce yourself as their A-Level Maths tutor, and ask what topic they'd like help with today. Mention you cover the full Edexcel specification.`;
    }

    // Define available tools for the AI (OpenAI format for Gemini compatibility)
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
              estimated_pomodoros: { type: "integer", description: "Estimated study sessions needed (default: 1)" }
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
          parameters: { type: "object", properties: {} }
        }
      },
      {
        type: "function",
        function: {
          name: "pause_timer",
          description: "Pause the study timer",
          parameters: { type: "object", properties: {} }
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
          parameters: { type: "object", properties: {} }
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

    // Convert tools to Gemini format
    const geminiTools = [{
      functionDeclarations: tools.map(t => ({
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters
      }))
    }];

    // Convert messages to Gemini format
    const geminiContents: any[] = [];
    
    // Add system instruction separately
    const sanitizedMessages = (messages || []).map((msg: any) => {
      if (typeof msg.content === 'string') {
        return {
          ...msg,
          content: msg.content.replace(/get_active_task/gi, 'current topic')
        };
      }
      return msg;
    });

    for (const msg of sanitizedMessages) {
      if (msg.role === 'user') {
        geminiContents.push({
          role: 'user',
          parts: [{ text: msg.content || '' }]
        });
      } else if (msg.role === 'assistant') {
        const parts: any[] = [];
        if (msg.content) {
          parts.push({ text: msg.content });
        }
        if (msg.tool_calls) {
          for (const tc of msg.tool_calls) {
            parts.push({
              functionCall: {
                name: tc.function.name,
                args: JSON.parse(tc.function.arguments || '{}')
              }
            });
          }
        }
        if (parts.length > 0) {
          geminiContents.push({ role: 'model', parts });
        }
      } else if (msg.role === 'tool') {
        // Tool results go as user messages with functionResponse
        geminiContents.push({
          role: 'user',
          parts: [{
            functionResponse: {
              name: msg.name,
              response: { result: msg.content }
            }
          }]
        });
      }
    }

    // Call Google Gemini API directly with user's API key
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${userGeminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: geminiContents,
          tools: geminiTools,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      
      if (geminiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded on your Gemini API key. Please wait a moment and try again." 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (geminiResponse.status === 400 && errorText.includes('API_KEY_INVALID')) {
        return new Response(JSON.stringify({ 
          error: "Your Gemini API key is invalid. Please update it in Settings.",
          code: "INVALID_API_KEY"
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    // Transform Gemini SSE stream to OpenAI-compatible format
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;
          
          try {
            const geminiData = JSON.parse(jsonStr);
            const candidate = geminiData.candidates?.[0];
            if (!candidate) continue;
            
            const parts = candidate.content?.parts || [];
            
            for (const part of parts) {
              if (part.text) {
                // Convert to OpenAI format
                const openaiChunk = {
                  choices: [{
                    delta: { content: part.text },
                    index: 0
                  }]
                };
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
              }
              
              if (part.functionCall) {
                // Convert function call to OpenAI format
                const openaiChunk = {
                  choices: [{
                    delta: {
                      tool_calls: [{
                        id: `call_${Date.now()}`,
                        type: 'function',
                        function: {
                          name: part.functionCall.name,
                          arguments: JSON.stringify(part.functionCall.args || {})
                        }
                      }]
                    },
                    index: 0
                  }]
                };
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
              }
            }
            
            // Check for finish reason
            if (candidate.finishReason) {
              controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
            }
          } catch (e) {
            // Skip malformed JSON
            console.log('Skipping malformed chunk:', jsonStr.slice(0, 100));
          }
        }
      }
    });

    const transformedStream = geminiResponse.body?.pipeThrough(transformStream);

    return new Response(transformedStream, {
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
