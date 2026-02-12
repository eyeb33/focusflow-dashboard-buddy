-- Add time_spent_seconds column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER NOT NULL DEFAULT 0;