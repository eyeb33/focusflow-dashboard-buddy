-- Add completed_at column to tasks table to track when tasks are completed
ALTER TABLE public.tasks 
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;

-- Create an index for efficient querying by completion date
CREATE INDEX idx_tasks_completed_at ON public.tasks(completed_at);

-- Update existing completed tasks to have a completed_at timestamp (using updated_at as fallback)
UPDATE public.tasks 
SET completed_at = updated_at 
WHERE completed = true AND completed_at IS NULL;