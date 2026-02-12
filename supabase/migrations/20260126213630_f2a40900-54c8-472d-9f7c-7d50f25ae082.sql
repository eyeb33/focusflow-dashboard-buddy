-- Add composite index for efficient lookup by topic + persona combination
-- This enables separate chat sessions per mode within the same topic
CREATE INDEX IF NOT EXISTS idx_coach_conversations_topic_persona 
ON public.coach_conversations(user_id, linked_topic_id, persona)
WHERE linked_topic_id IS NOT NULL;