-- Add title, persona, and exam_board columns to coach_conversations
ALTER TABLE public.coach_conversations
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'New session',
ADD COLUMN IF NOT EXISTS persona TEXT DEFAULT 'explain',
ADD COLUMN IF NOT EXISTS exam_board TEXT DEFAULT 'AQA';

-- Create index for faster session lookups
CREATE INDEX IF NOT EXISTS idx_coach_conversations_user_updated
ON public.coach_conversations (user_id, updated_at DESC);