-- Add gemini_api_key to profiles table for student's own API keys
-- This stores encrypted API keys that students provide for their AI tutor
ALTER TABLE public.profiles 
ADD COLUMN gemini_api_key text;

-- Add a comment to document the column
COMMENT ON COLUMN public.profiles.gemini_api_key IS 'Student-provided Gemini API key for AI tutor access';