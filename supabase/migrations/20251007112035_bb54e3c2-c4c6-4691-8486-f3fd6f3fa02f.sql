-- Fix 1: Add database function to properly save session progress
CREATE OR REPLACE FUNCTION public.save_session_progress(
  p_user_id UUID,
  p_session_type TEXT,
  p_duration INTEGER,
  p_completed BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Insert the session
  INSERT INTO focus_sessions (user_id, session_type, duration, completed)
  VALUES (p_user_id, p_session_type, p_duration, p_completed)
  RETURNING id INTO v_session_id;
  
  -- Update or create daily summary
  INSERT INTO sessions_summary (user_id, date, total_completed_sessions, total_focus_time)
  VALUES (
    p_user_id,
    v_today,
    CASE WHEN p_completed THEN 1 ELSE 0 END,
    CASE WHEN p_completed AND p_session_type = 'work' THEN p_duration / 60 ELSE 0 END
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_completed_sessions = sessions_summary.total_completed_sessions + 
      CASE WHEN p_completed THEN 1 ELSE 0 END,
    total_focus_time = sessions_summary.total_focus_time + 
      CASE WHEN p_completed AND p_session_type = 'work' THEN p_duration / 60 ELSE 0 END,
    updated_at = now();
  
  RETURN v_session_id;
END;
$$;

-- Fix 2: Add function to update productivity score
CREATE OR REPLACE FUNCTION public.update_productivity_score(
  p_user_id UUID,
  p_date DATE,
  p_score INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO productivity_trends (user_id, date, productivity_score)
  VALUES (p_user_id, p_date, p_score)
  ON CONFLICT (user_id, date) DO UPDATE SET
    productivity_score = p_score,
    updated_at = now();
END;
$$;

-- Fix 3: Add function to generate insights based on user activity
CREATE OR REPLACE FUNCTION public.generate_user_insight(
  p_user_id UUID,
  p_title TEXT,
  p_content TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_insight_id UUID;
BEGIN
  INSERT INTO insights (user_id, title, content)
  VALUES (p_user_id, p_title, p_content)
  RETURNING id INTO v_insight_id;
  
  RETURN v_insight_id;
END;
$$;

-- Fix 4: Add trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();