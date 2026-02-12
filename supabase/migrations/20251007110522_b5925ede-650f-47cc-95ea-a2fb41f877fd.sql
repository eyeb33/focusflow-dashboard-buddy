-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create focus_sessions table for tracking pomodoro sessions
CREATE TABLE public.focus_sessions (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('work', 'short_break', 'long_break')),
  duration INTEGER NOT NULL, -- duration in seconds
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on focus_sessions
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- Focus sessions policies
CREATE POLICY "Users can view their own sessions"
  ON public.focus_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.focus_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.focus_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.focus_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Create sessions_summary table for aggregated daily stats
CREATE TABLE public.sessions_summary (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_completed_sessions INTEGER NOT NULL DEFAULT 0,
  total_focus_time INTEGER NOT NULL DEFAULT 0, -- total minutes
  longest_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on sessions_summary
ALTER TABLE public.sessions_summary ENABLE ROW LEVEL SECURITY;

-- Sessions summary policies
CREATE POLICY "Users can view their own summary"
  ON public.sessions_summary FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own summary"
  ON public.sessions_summary FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own summary"
  ON public.sessions_summary FOR UPDATE
  USING (auth.uid() = user_id);

-- Create insights table for productivity insights
CREATE TABLE public.insights (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on insights
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- Insights policies
CREATE POLICY "Users can view their own insights"
  ON public.insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insights"
  ON public.insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights"
  ON public.insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights"
  ON public.insights FOR DELETE
  USING (auth.uid() = user_id);

-- Create productivity_trends table
CREATE TABLE public.productivity_trends (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  productivity_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on productivity_trends
ALTER TABLE public.productivity_trends ENABLE ROW LEVEL SECURITY;

-- Productivity trends policies
CREATE POLICY "Users can view their own trends"
  ON public.productivity_trends FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trends"
  ON public.productivity_trends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trends"
  ON public.productivity_trends FOR UPDATE
  USING (auth.uid() = user_id);

-- Add updated_at triggers for all new tables
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER focus_sessions_updated_at
  BEFORE UPDATE ON public.focus_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER sessions_summary_updated_at
  BEFORE UPDATE ON public.sessions_summary
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER insights_updated_at
  BEFORE UPDATE ON public.insights
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER productivity_trends_updated_at
  BEFORE UPDATE ON public.productivity_trends
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better query performance
CREATE INDEX idx_focus_sessions_user_created ON public.focus_sessions(user_id, created_at DESC);
CREATE INDEX idx_focus_sessions_user_type ON public.focus_sessions(user_id, session_type);
CREATE INDEX idx_sessions_summary_user_date ON public.sessions_summary(user_id, date DESC);
CREATE INDEX idx_productivity_trends_user_date ON public.productivity_trends(user_id, date DESC);