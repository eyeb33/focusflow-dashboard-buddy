-- Add active_subtopic column to coach_conversations for per-subtopic chat sessions
ALTER TABLE public.coach_conversations 
ADD COLUMN IF NOT EXISTS linked_subtopic TEXT DEFAULT NULL;

-- Create index for faster lookups by topic + subtopic + persona
CREATE INDEX IF NOT EXISTS idx_conversations_topic_subtopic_persona 
ON public.coach_conversations (user_id, linked_topic_id, linked_subtopic, persona) 
WHERE linked_topic_id IS NOT NULL;