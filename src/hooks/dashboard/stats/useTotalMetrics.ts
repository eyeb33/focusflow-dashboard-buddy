
import { supabase } from '@/integrations/supabase/client';

interface TotalMetrics {
  totalSessions: number;
  totalMinutes: number;
}

export const fetchTotalMetrics = async (userId: string, today: string): Promise<TotalMetrics> => {
  // First check the sessions_summary table for today's data
  const { data: todaySummary, error: todaySummaryError } = await supabase
    .from('sessions_summary')
    .select('total_completed_sessions, total_focus_time')
    .eq('user_id', userId)
    .eq('date', today)
    .single();
    
  if (todaySummaryError && todaySummaryError.code !== 'PGRST116') {
    console.error('Error fetching today summary:', todaySummaryError);
  }
  
  // Fetch completed sessions count
  const { data: sessionCount, error: sessionError } = await supabase
    .from('focus_sessions')
    .select('count')
    .eq('user_id', userId)
    .eq('completed', true)
    .eq('session_type', 'work');

  // Fetch total focus time
  const { data: focusTimeData, error: timeError } = await supabase
    .from('focus_sessions')
    .select('duration, session_type')
    .eq('user_id', userId)
    .eq('session_type', 'work');

  if (sessionError || timeError) {
    console.error('Error fetching sessions or time:', sessionError || timeError);
    return { totalSessions: 0, totalMinutes: 0 };
  }

  // Calculate total focus minutes (only from work sessions)
  const totalMinutesFromSessions = focusTimeData?.reduce((acc: number, session: any) => 
    acc + (session.session_type === 'work' ? Math.floor(session.duration / 60) : 0), 0) || 0;
    
  // If we have today's summary, use that value for total minutes
  const totalMinutes = todaySummary ? todaySummary.total_focus_time : totalMinutesFromSessions;
  
  const totalSessions = sessionCount?.[0]?.count || 0;

  return { totalSessions, totalMinutes };
};
