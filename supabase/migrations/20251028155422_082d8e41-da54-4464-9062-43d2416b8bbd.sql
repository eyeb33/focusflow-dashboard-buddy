-- Add session goal and reflection columns to focus_sessions
ALTER TABLE focus_sessions
ADD COLUMN IF NOT EXISTS session_goal text,
ADD COLUMN IF NOT EXISTS session_quality text CHECK (session_quality IN ('completed', 'progress', 'distracted')),
ADD COLUMN IF NOT EXISTS session_reflection text;

-- Add index for quality filtering
CREATE INDEX IF NOT EXISTS idx_focus_sessions_quality ON focus_sessions(session_quality) WHERE session_quality IS NOT NULL;