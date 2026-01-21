import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate authentication
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

    // Use service role to access the secure user_secrets table
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, api_key } = await req.json();

    switch (action) {
      case 'check': {
        // Check if user has an API key configured (don't return the actual key!)
        const { data, error } = await supabaseAdmin
          .from('user_secrets')
          .select('gemini_api_key')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking API key:', error);
          return new Response(JSON.stringify({ error: 'Failed to check API key status' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const hasKey = !!data?.gemini_api_key;
        let maskedKey = null;
        
        if (hasKey && data.gemini_api_key) {
          const key = data.gemini_api_key;
          maskedKey = `${key.slice(0, 8)}${'•'.repeat(20)}${key.slice(-4)}`;
        }

        return new Response(JSON.stringify({ 
          hasKey,
          maskedKey
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'save': {
        if (!api_key || typeof api_key !== 'string') {
          return new Response(JSON.stringify({ error: 'API key is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const trimmedKey = api_key.trim();
        
        // Basic validation - check format
        if (!trimmedKey.startsWith('AIza') || trimmedKey.length < 30) {
          return new Response(JSON.stringify({ error: 'Invalid API key format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Upsert the key
        const { error } = await supabaseAdmin
          .from('user_secrets')
          .upsert({
            user_id: user.id,
            gemini_api_key: trimmedKey,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (error) {
          console.error('Error saving API key:', error);
          return new Response(JSON.stringify({ error: 'Failed to save API key' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const maskedKey = `${trimmedKey.slice(0, 8)}${'•'.repeat(20)}${trimmedKey.slice(-4)}`;

        console.log(`[manage-api-key] User ${user.id} saved Gemini API key`);

        return new Response(JSON.stringify({ 
          success: true,
          maskedKey
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'remove': {
        const { error } = await supabaseAdmin
          .from('user_secrets')
          .update({ gemini_api_key: null, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error removing API key:', error);
          return new Response(JSON.stringify({ error: 'Failed to remove API key' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log(`[manage-api-key] User ${user.id} removed Gemini API key`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action. Use: check, save, or remove' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('[manage-api-key] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
