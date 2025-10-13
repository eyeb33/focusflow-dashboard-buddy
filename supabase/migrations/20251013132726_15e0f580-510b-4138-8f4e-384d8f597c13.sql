-- Create enum for message roles
CREATE TYPE public.coach_role AS ENUM ('user', 'assistant');

-- Create coach_conversations table
CREATE TABLE public.coach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coach_messages table
CREATE TABLE public.coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.coach_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role coach_role NOT NULL,
  content TEXT NOT NULL,
  context_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coach_check_ins table
CREATE TABLE public.coach_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mood_rating INTEGER NOT NULL CHECK (mood_rating >= 1 AND mood_rating <= 5),
  energy_level INTEGER NOT NULL CHECK (energy_level >= 1 AND energy_level <= 5),
  stress_level INTEGER NOT NULL CHECK (stress_level >= 1 AND stress_level <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_check_ins ENABLE ROW LEVEL SECURITY;

-- RLS policies for coach_conversations
CREATE POLICY "Users can view their own conversations"
  ON public.coach_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON public.coach_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON public.coach_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON public.coach_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for coach_messages
CREATE POLICY "Users can view their own messages"
  ON public.coach_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages"
  ON public.coach_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON public.coach_messages FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for coach_check_ins
CREATE POLICY "Users can view their own check-ins"
  ON public.coach_check_ins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own check-ins"
  ON public.coach_check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own check-ins"
  ON public.coach_check_ins FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_coach_conversations_user_id ON public.coach_conversations(user_id);
CREATE INDEX idx_coach_conversations_last_message ON public.coach_conversations(last_message_at DESC);
CREATE INDEX idx_coach_messages_conversation_id ON public.coach_messages(conversation_id);
CREATE INDEX idx_coach_messages_user_id ON public.coach_messages(user_id);
CREATE INDEX idx_coach_messages_created_at ON public.coach_messages(created_at DESC);
CREATE INDEX idx_coach_check_ins_user_id ON public.coach_check_ins(user_id);
CREATE INDEX idx_coach_check_ins_created_at ON public.coach_check_ins(created_at DESC);

-- Create trigger for updated_at on coach_conversations
CREATE TRIGGER handle_coach_conversations_updated_at
  BEFORE UPDATE ON public.coach_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();