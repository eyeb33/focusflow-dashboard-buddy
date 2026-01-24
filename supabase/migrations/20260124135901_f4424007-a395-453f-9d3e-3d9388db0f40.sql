-- Add mode column to coach_messages to persist which tutor mode each message was created in
ALTER TABLE public.coach_messages
ADD COLUMN mode text DEFAULT 'explain';

-- Update existing messages to have a default mode
UPDATE public.coach_messages SET mode = 'explain' WHERE mode IS NULL;