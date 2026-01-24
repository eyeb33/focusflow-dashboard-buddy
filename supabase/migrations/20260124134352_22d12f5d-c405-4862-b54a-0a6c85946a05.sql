-- Fix #1: Add RLS policies for user_secrets table
-- Users should only be able to access their own secrets

-- Policy: Users can view their own secrets
CREATE POLICY "Users can view their own secrets"
ON public.user_secrets
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own secrets
CREATE POLICY "Users can insert their own secrets"
ON public.user_secrets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own secrets
CREATE POLICY "Users can update their own secrets"
ON public.user_secrets
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own secrets
CREATE POLICY "Users can delete their own secrets"
ON public.user_secrets
FOR DELETE
USING (auth.uid() = user_id);

-- Fix #2: Remove overly permissive read policy on document_chunks
-- The match_documents function already uses SECURITY DEFINER to provide controlled access
DROP POLICY IF EXISTS "Authenticated users can read document chunks" ON public.document_chunks;