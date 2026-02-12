-- Create timer_sessions table for tracking continuous timer runs
CREATE TABLE public.timer_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  mode TEXT NOT NULL DEFAULT 'pomodoro', -- 'pomodoro' or 'free'
  total_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create topic_time_segments table for tracking time per topic within a session
CREATE TABLE public.topic_time_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timer_session_id UUID NOT NULL REFERENCES public.timer_sessions(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_timer_sessions_user_id ON public.timer_sessions(user_id);
CREATE INDEX idx_timer_sessions_started_at ON public.timer_sessions(started_at DESC);
CREATE INDEX idx_timer_sessions_open ON public.timer_sessions(user_id) WHERE ended_at IS NULL;

CREATE INDEX idx_topic_time_segments_timer_session ON public.topic_time_segments(timer_session_id);
CREATE INDEX idx_topic_time_segments_topic ON public.topic_time_segments(topic_id);
CREATE INDEX idx_topic_time_segments_user_topic ON public.topic_time_segments(user_id, topic_id);
CREATE INDEX idx_topic_time_segments_open ON public.topic_time_segments(user_id) WHERE ended_at IS NULL;

-- Enable RLS on timer_sessions
ALTER TABLE public.timer_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own timer sessions"
ON public.timer_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own timer sessions"
ON public.timer_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timer sessions"
ON public.timer_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timer sessions"
ON public.timer_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on topic_time_segments
ALTER TABLE public.topic_time_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own time segments"
ON public.topic_time_segments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own time segments"
ON public.topic_time_segments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time segments"
ON public.topic_time_segments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time segments"
ON public.topic_time_segments FOR DELETE
USING (auth.uid() = user_id);

-- Function to get total time spent on a topic (aggregating all segments)
CREATE OR REPLACE FUNCTION public.get_topic_total_time(p_user_id UUID, p_topic_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(duration_seconds), 0)
  INTO total
  FROM topic_time_segments
  WHERE user_id = p_user_id AND topic_id = p_topic_id;
  
  RETURN total;
END;
$$;

-- Function to get time spent on a topic within a date range
CREATE OR REPLACE FUNCTION public.get_topic_time_in_range(
  p_user_id UUID, 
  p_topic_id TEXT,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(duration_seconds), 0)
  INTO total
  FROM topic_time_segments
  WHERE user_id = p_user_id 
    AND topic_id = p_topic_id
    AND started_at >= p_start_date
    AND started_at < p_end_date;
  
  RETURN total;
END;
$$;

-- Function to close any open segments for a user (safety cleanup)
CREATE OR REPLACE FUNCTION public.close_open_segments(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  closed_count INTEGER;
BEGIN
  WITH updated AS (
    UPDATE topic_time_segments
    SET 
      ended_at = now(),
      duration_seconds = EXTRACT(EPOCH FROM (now() - started_at))::INTEGER
    WHERE user_id = p_user_id AND ended_at IS NULL
    RETURNING id
  )
  SELECT COUNT(*) INTO closed_count FROM updated;
  
  RETURN closed_count;
END;
$$;