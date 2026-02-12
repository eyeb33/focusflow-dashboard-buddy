-- Add column to track the last model used for API requests
ALTER TABLE public.api_usage 
ADD COLUMN last_model_used TEXT;