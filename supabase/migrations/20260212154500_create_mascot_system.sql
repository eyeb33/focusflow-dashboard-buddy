-- Create mascot_streaks table for tracking user progress
CREATE TABLE IF NOT EXISTS mascot_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Streak tracking
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  consecutive_days INTEGER DEFAULT 0,
  sessions_today INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  
  -- Learning stats
  total_problems_attempted INTEGER DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0,
  exam_ready_topics INTEGER DEFAULT 0,
  persistence_count INTEGER DEFAULT 0,
  topics_explored INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  
  -- Behavior patterns (JSONB for flexibility)
  behavior_patterns JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Create achievements table for storing unlocked achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  
  -- Achievement metadata
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mascot_streaks_user_id ON mascot_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_achievement_id ON achievements(achievement_id);

-- Enable Row Level Security
ALTER TABLE mascot_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mascot_streaks
CREATE POLICY "Users can view their own streak data"
  ON mascot_streaks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak data"
  ON mascot_streaks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak data"
  ON mascot_streaks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for achievements
CREATE POLICY "Users can view their own achievements"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mascot_streaks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Update best_streak if current_streak is higher
  IF NEW.current_streak > NEW.best_streak THEN
    NEW.best_streak = NEW.current_streak;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at and best_streak
CREATE TRIGGER update_mascot_streaks_timestamp
BEFORE UPDATE ON mascot_streaks
FOR EACH ROW
EXECUTE FUNCTION update_mascot_streaks_updated_at();

-- Grant permissions
GRANT ALL ON mascot_streaks TO authenticated;
GRANT ALL ON achievements TO authenticated;
