-- Create lesson_states table for structured learning flow
-- Tracks student progress through mini-lesson stages

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
CREATE INDEX idx_lesson_states_user_topic 
ON lesson_states(user_id, topic_id, subtopic);

CREATE INDEX idx_lesson_states_user_active
ON lesson_states(user_id, completed) WHERE completed = false;

-- Enable Row Level Security
ALTER TABLE lesson_states ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own lesson states
CREATE POLICY "Users can view own lesson states"
ON lesson_states FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own lesson states  
CREATE POLICY "Users can create own lesson states"
ON lesson_states FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own lesson states
CREATE POLICY "Users can update own lesson states"
ON lesson_states FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own lesson states
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
