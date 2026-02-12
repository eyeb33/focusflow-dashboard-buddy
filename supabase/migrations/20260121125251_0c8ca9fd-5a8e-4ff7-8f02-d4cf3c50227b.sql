-- 1. Add is_admin column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Set the existing admin user
UPDATE public.profiles SET is_admin = true WHERE user_id = '9d326b17-8987-4a2f-a104-0ef900b6c382';

-- 2. Fix documents table RLS - remove the overly permissive "All authenticated users can read ready documents" policy
DROP POLICY IF EXISTS "All authenticated users can read ready documents" ON public.documents;

-- Add read-only access to ready documents for students (they need document metadata for RAG search)
CREATE POLICY "Authenticated users can view ready document metadata"
ON public.documents
FOR SELECT
USING (
  auth.role() = 'authenticated' 
  AND status = 'ready'
);

-- 3. Update documents management to be admin-only
DROP POLICY IF EXISTS "Owner can manage documents" ON public.documents;

-- Admins can manage all curriculum documents
CREATE POLICY "Admins can manage documents"
ON public.documents
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- 4. Fix document_chunks RLS - keep read access for RAG, restrict management to admins
DROP POLICY IF EXISTS "Owner can manage document chunks" ON public.document_chunks;

CREATE POLICY "Admins can manage document chunks"
ON public.document_chunks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- 5. Fix storage bucket policies using proper Supabase storage API
-- Drop existing storage policies for curriculum-documents
DROP POLICY IF EXISTS "authenticated users can access curriculum documents" ON storage.objects;
DROP POLICY IF EXISTS "Owner can upload curriculum documents" ON storage.objects;

-- Only admins can upload/manage curriculum documents
CREATE POLICY "Admins can upload curriculum documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'curriculum-documents'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can update curriculum documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'curriculum-documents'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can delete curriculum documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'curriculum-documents'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Authenticated users can read curriculum documents (needed for document processing edge function)
CREATE POLICY "Authenticated users can read curriculum documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'curriculum-documents'
  AND auth.role() = 'authenticated'
);