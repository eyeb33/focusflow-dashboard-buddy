-- First create the updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Enable pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Table to store uploaded curriculum documents
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  total_chunks INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Table to store document chunks with embeddings
CREATE TABLE public.document_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_tokens INTEGER DEFAULT 0,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast similarity search
CREATE INDEX ON public.document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create index for document lookups
CREATE INDEX idx_document_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Owner can manage documents"
ON public.documents
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "All authenticated users can read ready documents"
ON public.documents
FOR SELECT
USING (auth.role() = 'authenticated' AND status = 'ready');

-- RLS Policies for document_chunks
CREATE POLICY "Authenticated users can read document chunks"
ON public.document_chunks
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Owner can manage document chunks"
ON public.document_chunks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = document_chunks.document_id 
    AND documents.user_id = auth.uid()
  )
);

-- Function to match documents using cosine similarity
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN documents d ON d.id = dc.document_id
  WHERE d.status = 'ready'
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create storage bucket for curriculum documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('curriculum-documents', 'curriculum-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for curriculum documents bucket
CREATE POLICY "Owner can upload curriculum documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'curriculum-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owner can view their uploaded documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'curriculum-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owner can delete their documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'curriculum-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Trigger to update updated_at on documents
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();