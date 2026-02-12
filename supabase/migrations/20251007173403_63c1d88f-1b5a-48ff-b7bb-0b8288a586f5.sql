-- Enable realtime for all productivity tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.focus_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions_summary;
ALTER PUBLICATION supabase_realtime ADD TABLE public.productivity_trends;
ALTER PUBLICATION supabase_realtime ADD TABLE public.insights;