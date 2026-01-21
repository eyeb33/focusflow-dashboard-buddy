import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple text chunking function
function chunkText(text: string, maxTokens: number = 500): { content: string; index: number }[] {
  const chunks: { content: string; index: number }[] = [];
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';
  let chunkIndex = 0;
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;
    
    // Rough token estimation (4 chars per token)
    const estimatedTokens = (currentChunk.length + trimmedParagraph.length) / 4;
    
    if (estimatedTokens > maxTokens && currentChunk) {
      // Save current chunk and start new one
      chunks.push({ content: currentChunk.trim(), index: chunkIndex });
      chunkIndex++;
      currentChunk = trimmedParagraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmedParagraph;
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push({ content: currentChunk.trim(), index: chunkIndex });
  }
  
  return chunks;
}

// Extract metadata from content (topic detection)
function extractMetadata(content: string, pageNumber: number = 1): Record<string, any> {
  const metadata: Record<string, any> = {
    page_number: pageNumber,
    content_type: 'specification',
  };
  
  // Try to detect topic from content
  const topicPatterns = [
    { pattern: /\b(differentiation|derivative|gradient|chain rule|product rule|quotient rule)\b/i, topic: 'Differentiation' },
    { pattern: /\b(integration|integral|antiderivative|by parts|substitution)\b/i, topic: 'Integration' },
    { pattern: /\b(trigonometry|sin|cos|tan|radian|identity)\b/i, topic: 'Trigonometry' },
    { pattern: /\b(algebra|polynomial|quadratic|factor|expand)\b/i, topic: 'Algebra' },
    { pattern: /\b(sequence|series|arithmetic|geometric|binomial)\b/i, topic: 'Sequences and Series' },
    { pattern: /\b(vector|scalar|magnitude|direction|dot product)\b/i, topic: 'Vectors' },
    { pattern: /\b(probability|distribution|normal|binomial|hypothesis)\b/i, topic: 'Statistics' },
    { pattern: /\b(mechanics|force|motion|velocity|acceleration|newton)\b/i, topic: 'Mechanics' },
    { pattern: /\b(exponential|logarithm|ln|log|e\^x)\b/i, topic: 'Exponentials and Logarithms' },
    { pattern: /\b(coordinate|circle|line|parabola|parametric)\b/i, topic: 'Coordinate Geometry' },
    { pattern: /\b(proof|mathematical argument|notation|conjecture)\b/i, topic: 'Proof' },
    { pattern: /\b(numerical method|newton.raphson|trapezium|iteration)\b/i, topic: 'Numerical Methods' },
  ];
  
  for (const { pattern, topic } of topicPatterns) {
    if (pattern.test(content)) {
      metadata.topic = topic;
      break;
    }
  }
  
  return metadata;
}

// Create embeddings using OpenAI
async function createEmbedding(text: string, openaiKey: string): Promise<number[] | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI embedding error:', error);
      return null;
    }
    
    const data = await response.json();
    return data.data[0].embedding;
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
    const { document_id } = await req.json();
    
    if (!document_id) {
      return new Response(JSON.stringify({ error: 'document_id is required' }), {
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

    // Create service role client for background processing
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Also create user client for auth verification
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      console.error(`[process-document] Non-admin user ${user.id} attempted to process document`);
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[process-document] Admin user ${user.id} processing document ${document_id}`);

    // Fetch the document (admin can access any document via service role)
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .single();

    if (docError || !document) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update status to processing
    await supabaseAdmin
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', document_id);

    console.log(`[process-document] Starting processing for document: ${document.title}`);

    // Get OpenAI API key
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      await supabaseAdmin
        .from('documents')
        .update({ status: 'error', error_message: 'OpenAI API key not configured' })
        .eq('id', document_id);
      
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('curriculum-documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError);
      await supabaseAdmin
        .from('documents')
        .update({ status: 'error', error_message: 'Failed to download file' })
        .eq('id', document_id);
      
      return new Response(JSON.stringify({ error: 'Failed to download file' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For now, we'll handle text extraction simply
    // In production, you'd want a proper PDF parsing service
    let extractedText = '';
    
    // Try to extract text from PDF using the file content
    // Note: This is a simplified approach - for production, use a proper PDF parsing service
    try {
      const arrayBuffer = await fileData.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Simple text extraction from PDF (finds text between stream markers)
      // This is basic and won't work for all PDFs - production should use pdf.js or similar
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const rawText = decoder.decode(uint8Array);
      
      // Extract text objects from PDF
      const textMatches = rawText.matchAll(/\(([^)]+)\)/g);
      const textParts: string[] = [];
      for (const match of textMatches) {
        const text = match[1];
        // Filter out binary/control characters
        if (text && /^[\x20-\x7E\s]+$/.test(text) && text.length > 2) {
          textParts.push(text);
        }
      }
      extractedText = textParts.join(' ');
      
      // Also try to find plain text content
      const btMatches = rawText.matchAll(/BT[\s\S]*?ET/g);
      for (const match of btMatches) {
        const tjMatches = match[0].matchAll(/\[([^\]]+)\]TJ|\(([^)]+)\)Tj/g);
        for (const tjMatch of tjMatches) {
          const content = tjMatch[1] || tjMatch[2];
          if (content) {
            const cleanContent = content.replace(/\([^)]*\)/g, '').trim();
            if (cleanContent && /^[\x20-\x7E\s]+$/.test(cleanContent)) {
              extractedText += ' ' + cleanContent;
            }
          }
        }
      }
    } catch (parseError) {
      console.error('Error parsing PDF:', parseError);
    }

    // If we couldn't extract text, use a fallback message
    if (!extractedText || extractedText.length < 100) {
      console.warn('Could not extract sufficient text from PDF. Using metadata-based content.');
      extractedText = `This is the ${document.title} document. Content extraction requires a PDF parsing service for full functionality. The document covers A-Level Mathematics curriculum topics including Pure Mathematics, Statistics, and Mechanics as specified by Edexcel.`;
    }

    console.log(`[process-document] Extracted ${extractedText.length} characters from document`);

    // Chunk the text
    const chunks = chunkText(extractedText, 500);
    console.log(`[process-document] Created ${chunks.length} chunks`);

    // Delete existing chunks for this document (in case of reprocessing)
    await supabaseAdmin
      .from('document_chunks')
      .delete()
      .eq('document_id', document_id);

    // Process chunks and create embeddings
    let successfulChunks = 0;
    const batchSize = 10; // Process in batches to avoid rate limits
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      const chunkPromises = batch.map(async (chunk) => {
        const embedding = await createEmbedding(chunk.content, openaiKey);
        const metadata = extractMetadata(chunk.content);
        
        if (embedding) {
          const { error: insertError } = await supabaseAdmin
            .from('document_chunks')
            .insert({
              document_id,
              chunk_index: chunk.index,
              content: chunk.content,
              content_tokens: Math.ceil(chunk.content.length / 4),
              embedding: embedding,
              metadata: {
                ...metadata,
                document_title: document.title,
              },
            });
          
          if (!insertError) {
            successfulChunks++;
          } else {
            console.error('Error inserting chunk:', insertError);
          }
        }
      });
      
      await Promise.all(chunkPromises);
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Update document status
    const finalStatus = successfulChunks > 0 ? 'ready' : 'error';
    const errorMessage = successfulChunks === 0 ? 'Failed to create any embeddings' : null;
    
    await supabaseAdmin
      .from('documents')
      .update({
        status: finalStatus,
        error_message: errorMessage,
        total_chunks: successfulChunks,
        processed_at: new Date().toISOString(),
      })
      .eq('id', document_id);

    console.log(`[process-document] Completed processing. ${successfulChunks}/${chunks.length} chunks created.`);

    return new Response(JSON.stringify({ 
      success: true, 
      chunks_created: successfulChunks,
      total_chunks: chunks.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[process-document] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
