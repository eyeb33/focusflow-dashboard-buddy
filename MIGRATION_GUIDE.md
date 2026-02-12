# Quick Migration Guide

## Apply Database Migrations to Complete Setup

### Step-by-Step Instructions

#### 1. Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql

#### 2. Run Migration 1 - Mastery Tracking

Copy and paste this SQL into the SQL Editor:

```sql
-- Add mastery tracking columns to topic_sessions table

ALTER TABLE topic_sessions
ADD COLUMN IF NOT EXISTS attempted_problems INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS correct_problems INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS hints_used INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS exam_style_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS exam_style_correct INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS mastery_level TEXT DEFAULT 'not-started',
ADD COLUMN IF NOT EXISTS common_mistakes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS strength_areas JSONB DEFAULT '[]'::jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_topic_sessions_mastery ON topic_sessions(mastery_level);
CREATE INDEX IF NOT EXISTS idx_topic_sessions_user_topic ON topic_sessions(user_id, topic_id);

-- Add check constraint for mastery levels
ALTER TABLE topic_sessions 
DROP CONSTRAINT IF EXISTS check_mastery_level;

ALTER TABLE topic_sessions
ADD CONSTRAINT check_mastery_level 
CHECK (mastery_level IN ('not-started', 'learning', 'practiced', 'proficient', 'exam-ready'));
```

Click **RUN** button.

#### 3. Run Migration 2 - Lesson States

Copy and paste this SQL into the SQL Editor:

```sql
-- Create lesson_states table for structured learning tracking

CREATE TABLE IF NOT EXISTS lesson_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic_id TEXT NOT NULL,
  subtopic TEXT NOT NULL,
  current_stage TEXT NOT NULL DEFAULT 'LESSON_INTRO',
  prior_knowledge_level TEXT,
  mistakes_made JSONB DEFAULT '[]'::jsonb,
  checks_completed INT DEFAULT 0,
  checks_total INT DEFAULT 3,
  time_spent_seconds INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one active lesson per user/topic/subtopic
  UNIQUE(user_id, topic_id, subtopic, completed)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lesson_states_user ON lesson_states(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_states_active ON lesson_states(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_lesson_states_topic ON lesson_states(topic_id, subtopic);

-- Enable RLS
ALTER TABLE lesson_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own lesson states"
  ON lesson_states FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lesson states"
  ON lesson_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson states"
  ON lesson_states FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lesson states"
  ON lesson_states FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp
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
```

Click **RUN** button.

#### 4. Verify Migrations

Run this query to verify both migrations were successful:

```sql
-- Check topic_sessions has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'topic_sessions';

-- Check lesson_states table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lesson_states';
```

You should see:
- `topic_sessions` now has: `attempted_problems`, `correct_problems`, `hints_used`, `exam_style_attempts`, `exam_style_correct`, `mastery_level`, `common_mistakes`, `strength_areas`
- `lesson_states` table exists with all 14 columns

#### 5. Regenerate TypeScript Types

**Option A: Using Supabase Dashboard**
1. Go to Settings → API
2. Scroll to "TypeScript Types"
3. Copy the generated types
4. Replace contents of `src/types/database.ts`

**Option B: Using Supabase CLI**
```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

#### 6. Restart Dev Server

```bash
# Stop the current dev server (Ctrl+C)
# Then restart it
npm run dev
```

TypeScript errors should now be resolved! ✅

---

## Troubleshooting

### "column already exists" error
- Safe to ignore - means migration was partially run before
- Or add `ADD COLUMN IF NOT EXISTS` (already included above)

### "relation already exists" error  
- Table already created from previous run
- Safe to continue

### Permission denied errors
- Make sure you're logged into Supabase Dashboard as project owner
- Check that RLS policies were created successfully

### Types still showing errors
- Clear TypeScript cache: Delete `tsconfig.tsbuildinfo`
- Restart VS Code
- Make sure you saved the new `database.ts` file

---

## Quick Test

After migrations, test in browser console:

```javascript
// Check mastery tracking works
const { data } = await window.supabase
  .from('topic_sessions')
  .select('mastery_level')
  .limit(1);
console.log(data); // Should show mastery_level field

// Check lesson states works
const { data: lessons } = await window.supabase
  .from('lesson_states')
  .select('*')
  .limit(1);
console.log(lessons); // Should work without errors
```

✅ **Migration Complete!** All features are now live.
