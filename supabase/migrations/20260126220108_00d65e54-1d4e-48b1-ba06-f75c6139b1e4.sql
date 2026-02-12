-- Add active_subtopic column to track which subtopic the user is currently studying
ALTER TABLE public.topic_sessions 
ADD COLUMN IF NOT EXISTS active_subtopic TEXT DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.topic_sessions.active_subtopic IS 'Currently selected subtopic for focused study';