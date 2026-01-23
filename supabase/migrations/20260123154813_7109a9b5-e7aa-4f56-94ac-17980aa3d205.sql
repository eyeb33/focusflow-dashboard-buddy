-- Add composite indexes for performance optimization

-- Index for tasks: queries filter by user_id, completed status, and sort by sort_order
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed_sort 
ON public.tasks (user_id, completed, sort_order);

-- Index for sub_tasks: queries filter by user_id, parent_task_id and sort by sort_order
CREATE INDEX IF NOT EXISTS idx_sub_tasks_user_parent_sort 
ON public.sub_tasks (user_id, parent_task_id, sort_order);

-- Index for coach_messages: queries filter by conversation_id and order by created_at
CREATE INDEX IF NOT EXISTS idx_coach_messages_conversation_created 
ON public.coach_messages (conversation_id, created_at);

-- Additional useful indexes for common query patterns

-- Index for focus_sessions: queries filter by user_id and often order by created_at
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_created 
ON public.focus_sessions (user_id, created_at DESC);

-- Index for sessions_summary: queries filter by user_id and date
CREATE INDEX IF NOT EXISTS idx_sessions_summary_user_date 
ON public.sessions_summary (user_id, date DESC);

-- Index for productivity_trends: queries filter by user_id and date range
CREATE INDEX IF NOT EXISTS idx_productivity_trends_user_date 
ON public.productivity_trends (user_id, date DESC);

-- Index for topic_sessions: queries filter by user_id and is_active
CREATE INDEX IF NOT EXISTS idx_topic_sessions_user_active 
ON public.topic_sessions (user_id, is_active) WHERE is_active = true;

-- Index for coach_conversations: queries filter by user_id and order by last_message_at
CREATE INDEX IF NOT EXISTS idx_coach_conversations_user_last_message 
ON public.coach_conversations (user_id, last_message_at DESC);