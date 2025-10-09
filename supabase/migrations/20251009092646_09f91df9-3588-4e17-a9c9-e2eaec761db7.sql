-- Add time_spent field to tasks table to track actual minutes spent on each task
ALTER TABLE public.tasks
ADD COLUMN time_spent integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.tasks.time_spent IS 'Total minutes spent on this task';

-- Add index for querying tasks by time_spent
CREATE INDEX idx_tasks_time_spent ON public.tasks(time_spent DESC);