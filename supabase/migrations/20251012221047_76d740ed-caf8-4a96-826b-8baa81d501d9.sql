-- Add DELETE policies to allow users to delete their own data

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow users to delete their own session summaries
CREATE POLICY "Users can delete their own session summaries" 
ON public.sessions_summary 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow users to delete their own productivity trends
CREATE POLICY "Users can delete their own productivity trends" 
ON public.productivity_trends 
FOR DELETE 
USING (auth.uid() = user_id);