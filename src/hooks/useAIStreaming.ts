import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ChatMessage } from '@/hooks/useChatSessions';

export interface RAGSource {
  id: string;
  topic?: string;
  page_number?: number;
  document_title?: string;
  content_preview: string;
  similarity: number;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface StreamAccumulator {
  content: string;
  toolCalls: Map<string, ToolCall>;
  ragSources: RAGSource[];
}

/** Parse a single SSE chunk into the accumulator */
export function parseStreamChunk(
  parsed: any,
  accumulated: StreamAccumulator
): StreamAccumulator {
  const delta = parsed.choices?.[0]?.delta;

  if (delta?.content) {
    accumulated.content += delta.content;
  }

  if (delta?.tool_calls) {
    for (const tc of delta.tool_calls) {
      const toolCallId = tc.id || `tool_${accumulated.toolCalls.size}`;

      const existingByName = Array.from(accumulated.toolCalls.values()).find(
        (existing) =>
          existing.id === toolCallId &&
          existing.function.name &&
          tc.function?.name &&
          existing.function.name !== tc.function.name
      );

      if (existingByName) {
        const newKey = `${toolCallId}_${accumulated.toolCalls.size}`;
        accumulated.toolCalls.set(newKey, {
          id: newKey,
          type: 'function',
          function: { name: tc.function?.name || '', arguments: tc.function?.arguments || '' },
        });
      } else if (!accumulated.toolCalls.has(toolCallId)) {
        accumulated.toolCalls.set(toolCallId, {
          id: toolCallId,
          type: 'function',
          function: { name: '', arguments: '' },
        });
        const existing = accumulated.toolCalls.get(toolCallId)!;
        if (tc.function?.name) existing.function.name = tc.function.name;
        if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
      } else {
        const existing = accumulated.toolCalls.get(toolCallId)!;
        if (tc.id) existing.id = tc.id;
        if (tc.function?.name) existing.function.name = tc.function.name;
        if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
      }
    }
  }

  return accumulated;
}

/** Read an SSE stream from the AI edge function and call callbacks for each token */
export async function readAIStream(
  response: Response,
  onContent: (content: string) => void,
  onSources: (sources: RAGSource[]) => void
): Promise<StreamAccumulator> {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  const accumulated: StreamAccumulator = {
    content: '',
    toolCalls: new Map<string, ToolCall>(),
    ragSources: [],
  };

  if (!reader) return accumulated;

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
          onSources(parsed.sources);
          continue;
        }

        parseStreamChunk(parsed, accumulated);

        if (accumulated.content) {
          onContent(accumulated.content);
        }
      } catch {
        // Partial JSON split across chunks — continue
      }
    }
  }

  return accumulated;
}

/** Save an assistant message to the database */
export async function saveAssistantMessage(
  sessionId: string,
  userId: string,
  content: string,
  mode: string
): Promise<void> {
  await supabase.from('coach_messages').insert({
    conversation_id: sessionId,
    user_id: userId,
    role: 'assistant',
    content,
    mode,
  });

  await supabase
    .from('coach_conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', sessionId);
}
