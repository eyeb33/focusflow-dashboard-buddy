
import { supabase } from '@/integrations/supabase/client';

interface TotalMetrics {
  totalSessions: number;
  totalMinutes: number;
}

export const fetchTotalMetrics = async (userId: string, today: string): Promise<TotalMetrics> => {
  console.log(`Fetching total metrics for user ${userId} and date ${today}`);
  
  // First check if the date is valid
  if (!today || !today.match(/^\d{4}-\d{2}-\d{2}$/)) {
    console.error('Invalid date format:', today);
    today = new Date().toISOString().split('T')[0];
    console.log('Using current date instead:', today);
  }
  
  try {
    // First check the sessions_summary table for today's data
    const { data: todaySummary, error: todaySummaryError } = await supabase
      .from('sessions_summary')
      .select('total_completed_sessions, total_focus_time')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();
      
    if (todaySummaryError && todaySummaryError.code !== 'PGRST116') {
      console.error('Error fetching today summary:', todaySummaryError);
    }
    
    // If we found summary data for today, use that
    if (todaySummary) {
      console.log('Found today summary:', todaySummary, 'for date:', today);
      return { 
        totalSessions: todaySummary.total_completed_sessions || 0, 
        totalMinutes: todaySummary.total_focus_time || 0 
      };
    }
    
    // If no summary for today, we need to calculate from individual sessions
    console.log('No summary data for today, checking for individual sessions for date:', today);
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Fetch completed sessions count for today - ONLY work/focus sessions
    const { data: todaySessions, error: sessionError } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
      .eq('session_type', 'work')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    if (sessionError) {
      console.error('Error fetching today sessions:', sessionError);
      return { totalSessions: 0, totalMinutes: 0 };
    }

    // Calculate total minutes from all work sessions today
    const totalMinutesFromSessions = todaySessions?.reduce((acc: number, session: any) => 
      acc + (session.session_type === 'work' ? Math.floor(session.duration / 60) : 0), 0) || 0;
      
    const totalSessions = todaySessions?.length || 0;
    
    console.log('Calculated from today sessions:', { totalSessions, totalMinutesFromSessions }, 'for date:', today);

    return { totalSessions, totalMinutes: totalMinutesFromSessions };
  } catch (error) {
    console.error('Error in fetchTotalMetrics:', error);
    return { totalSessions: 0, totalMinutes: 0 };
  }
};
