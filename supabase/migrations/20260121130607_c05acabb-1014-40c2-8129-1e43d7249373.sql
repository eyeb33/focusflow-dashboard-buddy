-- Add auth.uid() verification to SECURITY DEFINER functions to prevent RLS bypass

-- Update save_session_progress to verify caller owns the user_id
CREATE OR REPLACE FUNCTION public.save_session_progress(p_user_id uuid, p_session_type text, p_duration integer, p_completed boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_session_id UUID;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Verify caller owns this user_id
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify other users data';
  END IF;

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
$function$;

-- Update increment_api_usage to verify caller owns the user_id
CREATE OR REPLACE FUNCTION public.increment_api_usage(p_user_id uuid, p_tokens integer DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify caller owns this user_id
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify other users data';
  END IF;

  INSERT INTO public.api_usage (user_id, date, request_count, token_count, last_request_at)
  VALUES (p_user_id, CURRENT_DATE, 1, COALESCE(p_tokens, 0), now())
  ON CONFLICT (user_id, date)
  DO UPDATE SET 
    request_count = api_usage.request_count + 1,
    token_count = api_usage.token_count + COALESCE(p_tokens, 0),
    last_request_at = now(),
    updated_at = now();
END;
$function$;

-- Update update_productivity_score to verify caller owns the user_id
CREATE OR REPLACE FUNCTION public.update_productivity_score(p_user_id uuid, p_date date, p_score integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify caller owns this user_id
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify other users data';
  END IF;

  INSERT INTO productivity_trends (user_id, date, productivity_score)
  VALUES (p_user_id, p_date, p_score)
  ON CONFLICT (user_id, date) DO UPDATE SET
    productivity_score = p_score,
    updated_at = now();
END;
$function$;

-- Update generate_user_insight to verify caller owns the user_id
CREATE OR REPLACE FUNCTION public.generate_user_insight(p_user_id uuid, p_title text, p_content text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_insight_id UUID;
BEGIN
  -- Verify caller owns this user_id
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify other users data';
  END IF;

  INSERT INTO insights (user_id, title, content)
  VALUES (p_user_id, p_title, p_content)
  RETURNING id INTO v_insight_id;
  
  RETURN v_insight_id;
END;
$function$;

-- Drop the deprecated gemini_api_key column from profiles table
-- Keys have been migrated to user_secrets table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS gemini_api_key;