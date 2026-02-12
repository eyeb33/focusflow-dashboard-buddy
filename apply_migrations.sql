-- ============================================================================
-- APPLY ALL MIGRATIONS - Copy this entire file and run in Supabase Dashboard
-- ============================================================================
-- Go to: https://supabase.com/dashboard/project/mphdigvrxgnckplongdu/sql
-- Paste this entire file into the SQL Editor and click RUN
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Add Mastery Tracking to topic_sessions
-- ============================================================================

ALTER TABLE topic_sessions
ADD COLUMN IF NOT EXISTS attempted_problems INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS correct_problems INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hints_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS exam_style_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS exam_style_correct INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mastery_level TEXT DEFAULT 'not-started',
ADD COLUMN IF NOT EXISTS common_mistakes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS strength_areas JSONB DEFAULT '[]'::jsonb;

-- Create index on mastery level for quick filtering queries
CREATE INDEX IF NOT EXISTS idx_topic_sessions_mastery 
ON topic_sessions(user_id, mastery_level);

-- Create index for performance on user queries
CREATE INDEX IF NOT EXISTS idx_topic_sessions_user_topic
ON topic_sessions(user_id, topic_id, active_subtopic);

-- Add comments for documentation
COMMENT ON COLUMN topic_sessions.mastery_level IS 
'Progress level: not-started, learning, practicing, comfortable, exam-ready';

COMMENT ON COLUMN topic_sessions.attempted_problems IS 
'Total number of practice problems attempted for this topic/subtopic';

COMMENT ON COLUMN topic_sessions.correct_problems IS 
'Number of problems solved correctly on first attempt';

COMMENT ON COLUMN topic_sessions.hints_used IS 
'Total hints requested across all problems';


-- ============================================================================
-- MIGRATION 2: Create lesson_states table for structured learning
-- ============================================================================

CREATE TABLE IF NOT EXISTS lesson_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL,
  subtopic TEXT NOT NULL,
  current_stage TEXT NOT NULL, -- e.g., 'LESSON_INTRO', 'PRIOR_KNOWLEDGE_CHECK', etc.
  prior_knowledge_level TEXT, -- 'never', 'a-bit', 'confident'
  mistakes_made JSONB DEFAULT '[]'::jsonb,
  checks_completed INTEGER DEFAULT 0,
  checks_total INTEGER DEFAULT 3,
  time_spent_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_lesson_states_user_topic 
ON lesson_states(user_id, topic_id, subtopic);

CREATE INDEX IF NOT EXISTS idx_lesson_states_user_active
ON lesson_states(user_id, completed) WHERE completed = false;

-- Enable Row Level Security
ALTER TABLE lesson_states ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own lesson states
DROP POLICY IF EXISTS "Users can view own lesson states" ON lesson_states;
CREATE POLICY "Users can view own lesson states"
ON lesson_states FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own lesson states  
DROP POLICY IF EXISTS "Users can create own lesson states" ON lesson_states;
CREATE POLICY "Users can create own lesson states"
ON lesson_states FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own lesson states
DROP POLICY IF EXISTS "Users can update own lesson states" ON lesson_states;
CREATE POLICY "Users can update own lesson states"
ON lesson_states FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own lesson states
DROP POLICY IF EXISTS "Users can delete own lesson states" ON lesson_states;
CREATE POLICY "Users can delete own lesson states"
ON lesson_states FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lesson_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lesson_states_updated_at ON lesson_states;
CREATE TRIGGER lesson_states_updated_at
BEFORE UPDATE ON lesson_states
FOR EACH ROW
EXECUTE FUNCTION update_lesson_states_updated_at();

-- Comments for documentation
COMMENT ON TABLE lesson_states IS 
'Tracks student progress through structured mini-lessons in Explain mode';

COMMENT ON COLUMN lesson_states.current_stage IS 
'Current lesson stage: LESSON_INTRO, PRIOR_KNOWLEDGE_CHECK, CONCEPT_OVERVIEW, EXAMPLE_TUTOR_DEMO, EXAMPLE_GUIDED, EXAMPLE_INDEPENDENT, QUICK_CHECK, REMEDIAL, SUMMARY, NEXT_STEPS';

COMMENT ON COLUMN lesson_states.prior_knowledge_level IS 
'Student familiarity: never, a-bit, confident - used to adapt teaching pace';

COMMENT ON COLUMN lesson_states.mistakes_made IS 
'Array of misconceptions identified during lesson for targeted remediation';


-- ============================================================================
-- VERIFICATION QUERIES (run these separately after to confirm success)
-- ============================================================================

-- Uncomment and run these AFTER the migrations to verify:

-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'topic_sessions' 
-- AND column_name IN ('mastery_level', 'attempted_problems', 'correct_problems');

-- SELECT COUNT(*) as lesson_states_table_exists FROM lesson_states;

-- ============================================================================
-- SUCCESS! Your migrations are complete.
-- Next step: Regenerate TypeScript types (see instructions below)
-- ============================================================================
