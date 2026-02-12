import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create embedding using Gemini (uses user's API key - no extra cost!)
async function createEmbedding(text: string, geminiApiKey: string): Promise<number[] | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: {
            parts: [{ text }]
          },
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini embedding error:', error);
      return null;
    }
    
    const data = await response.json();
    return data.embedding?.values || null;
  } catch (error) {
    console.error('Error creating embedding:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, match_count = 5, match_threshold = 0.5 } = await req.json();
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Fetch user's Gemini API key from secure user_secrets table
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: secretsData, error: secretsError } = await supabaseAdmin
      .from('user_secrets')
      .select('gemini_api_key')
      .eq('user_id', user.id)
      .maybeSingle();

    if (secretsError || !secretsData?.gemini_api_key) {
      return new Response(JSON.stringify({ 
        error: 'Gemini API key not configured. Please add your API key in Settings.',
        sources: [] 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiApiKey = secretsData.gemini_api_key;

    console.log(`[rag-search] Searching for: "${query.substring(0, 100)}..."`);

    // Create embedding for the query using Gemini
    const queryEmbedding = await createEmbedding(query, geminiApiKey);
    
    if (!queryEmbedding) {
      return new Response(JSON.stringify({ 
        error: 'Failed to create query embedding',
        sources: [] 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Search for similar documents using the match_documents function
    const { data: matches, error: searchError } = await supabaseClient
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: match_threshold,
        match_count: match_count,
      });

    if (searchError) {
      console.error('[rag-search] Search error:', searchError);
      return new Response(JSON.stringify({ 
        error: 'Search failed',
        sources: [] 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[rag-search] Found ${matches?.length || 0} relevant chunks`);

    // Format the results
    const sources = (matches || []).map((match: any) => ({
      id: match.id,
      document_id: match.document_id,
      content: match.content,
      metadata: match.metadata,
      similarity: match.similarity,
    }));

    return new Response(JSON.stringify({ 
      sources,
      query_length: query.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[rag-search] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      sources: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
