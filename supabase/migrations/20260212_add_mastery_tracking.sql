-- Add mastery tracking columns to topic_sessions table
-- This enables granular progress tracking from "Learning" to "Exam Ready"

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

-- Add comment for future reference
COMMENT ON COLUMN topic_sessions.mastery_level IS 
'Progress level: not-started, learning, practicing, comfortable, exam-ready';

COMMENT ON COLUMN topic_sessions.attempted_problems IS 
'Total number of practice problems attempted for this topic/subtopic';

COMMENT ON COLUMN topic_sessions.correct_problems IS 
'Number of problems solved correctly on first attempt';

COMMENT ON COLUMN topic_sessions.hints_used IS 
'Total hints requested across all problems';
