-- Create table to track API usage per user per day
CREATE TABLE public.api_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_count INTEGER NOT NULL DEFAULT 0,
  token_count INTEGER NOT NULL DEFAULT 0,
  last_request_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own API usage" 
ON public.api_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API usage" 
ON public.api_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API usage" 
ON public.api_usage 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to increment API usage atomically
CREATE OR REPLACE FUNCTION public.increment_api_usage(
  p_user_id UUID,
  p_tokens INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.api_usage (user_id, date, request_count, token_count, last_request_at)
  VALUES (p_user_id, CURRENT_DATE, 1, COALESCE(p_tokens, 0), now())
  ON CONFLICT (user_id, date)
  DO UPDATE SET 
    request_count = api_usage.request_count + 1,
    token_count = api_usage.token_count + COALESCE(p_tokens, 0),
    last_request_at = now(),
    updated_at = now();
END;
$$;