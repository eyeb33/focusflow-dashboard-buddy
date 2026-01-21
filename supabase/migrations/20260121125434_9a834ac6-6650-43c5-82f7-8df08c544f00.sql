-- Create a secure table for user secrets that is NOT accessible from client
CREATE TABLE public.user_secrets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  gemini_api_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS but with NO policies - this makes the table inaccessible from client
-- Only backend (service role) can access this table
ALTER TABLE public.user_secrets ENABLE ROW LEVEL SECURITY;

-- No RLS policies = no client access at all!
-- The service role bypasses RLS, so edge functions can still access it

-- Migrate existing API keys from profiles to user_secrets
INSERT INTO public.user_secrets (user_id, gemini_api_key)
SELECT user_id, gemini_api_key
FROM public.profiles
WHERE gemini_api_key IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
  gemini_api_key = EXCLUDED.gemini_api_key,
  updated_at = now();

-- Note: We keep gemini_api_key in profiles for now to avoid breaking changes
-- but we'll update the edge functions to use user_secrets instead
-- and the frontend will use an edge function to manage keys

-- Create updated_at trigger for user_secrets
CREATE TRIGGER update_user_secrets_updated_at
BEFORE UPDATE ON public.user_secrets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();