-- Add linked_task_id column to coach_conversations for linking chats to study topics
ALTER TABLE public.coach_conversations
ADD COLUMN linked_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_coach_conversations_linked_task ON public.coach_conversations(linked_task_id);

-- Add comment for documentation
COMMENT ON COLUMN public.coach_conversations.linked_task_id IS 'Links this chat session to a specific study topic/task';