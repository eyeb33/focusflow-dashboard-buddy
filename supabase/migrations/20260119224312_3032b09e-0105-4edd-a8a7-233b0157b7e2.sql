-- Enable REPLICA IDENTITY FULL for realtime updates
ALTER TABLE public.documents REPLICA IDENTITY FULL;