-- Create coach_actions table to log actions taken by the AI coach
CREATE TABLE IF NOT EXISTS public.coach_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.coach_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_params JSONB,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coach_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own coach actions"
  ON public.coach_actions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coach actions"
  ON public.coach_actions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_coach_actions_user_id ON public.coach_actions(user_id);
CREATE INDEX idx_coach_actions_conversation_id ON public.coach_actions(conversation_id);