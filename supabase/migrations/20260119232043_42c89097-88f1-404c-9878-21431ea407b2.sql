-- Add linked_topic_id column for curriculum topic linking (text-based IDs)
ALTER TABLE public.coach_conversations 
ADD COLUMN linked_topic_id TEXT;

-- Add index for faster lookup
CREATE INDEX idx_coach_conversations_linked_topic ON public.coach_conversations(user_id, linked_topic_id);

-- Add realtime support if not already enabled
ALTER TABLE public.coach_conversations REPLICA IDENTITY FULL;