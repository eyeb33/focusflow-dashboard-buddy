-- Update the embedding column from vector(1536) to vector(768) for Gemini embeddings
ALTER TABLE public.document_chunks 
ALTER COLUMN embedding TYPE vector(768);