-- Add sort_order column to tasks table for persistent ordering
ALTER TABLE public.tasks 
ADD COLUMN sort_order INTEGER;

-- Set initial sort_order based on current created_at order
-- This ensures existing tasks get a proper order
WITH ordered_tasks AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as row_num
  FROM public.tasks
)
UPDATE public.tasks
SET sort_order = ordered_tasks.row_num
FROM ordered_tasks
WHERE tasks.id = ordered_tasks.id;

-- Create index for better performance on ordering queries
CREATE INDEX idx_tasks_user_sort_order ON public.tasks(user_id, sort_order);