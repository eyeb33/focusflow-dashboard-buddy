-- Create sub_tasks table
CREATE TABLE public.sub_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sub_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own sub-tasks"
ON public.sub_tasks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sub-tasks"
ON public.sub_tasks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sub-tasks"
ON public.sub_tasks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sub-tasks"
ON public.sub_tasks
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sub_tasks_updated_at
BEFORE UPDATE ON public.sub_tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for sub_tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.sub_tasks;

-- Set replica identity for realtime delete events
ALTER TABLE public.sub_tasks REPLICA IDENTITY FULL;