
import { supabase } from '@/integrations/supabase/client';

export const fetchDailyAverageData = async (userId: string, today: string): Promise<number> => {
  // Get today's summary if available
  const { data: todaySummary, error: todaySummaryError } = await supabase
    .from('sessions_summary')
    .select('total_completed_sessions')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (todaySummaryError && todaySummaryError.code !== 'PGRST116') {
    console.error('Error fetching today summary:', todaySummaryError);
  }

  // Get historical summary data
  const { data: summaryData, error: summaryError } = await supabase
    .from('sessions_summary')
    .select('total_completed_sessions, date')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(30);

  if (summaryError) {
    console.error('Error fetching summary data:', summaryError);
    return 0;
  }

  // Count today's sessions if not already in summary
  let todayCompletedSessions = 0;
  if (todaySummary) {
    todayCompletedSessions = todaySummary.total_completed_sessions || 0;
  } else {
    // If no summary for today, count today's completed sessions from focus_sessions table
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const { data: todaySessions, error: todaySessionsError } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_type', 'work')
      .eq('completed', true)
      .gte('created_at', startOfDay.toISOString());
      
    if (!todaySessionsError) {
      todayCompletedSessions = todaySessions?.length || 0;
    }
  }
  
  // Calculate daily average including today's sessions
  const totalDaysWithActivity = (summaryData && summaryData.length > 0) ? summaryData.length : 1;
  const totalCompletedSessions = summaryData?.reduce((acc: number, day: any) => 
    acc + (day.total_completed_sessions || 0), 0) || 0;
  
  // Ensure we don't double-count today's sessions if it's already in the summary data
  const hasEntryToday = summaryData && summaryData.some(day => day.date === today);
  const adjustedTotalSessions = hasEntryToday ? 
    totalCompletedSessions : 
    totalCompletedSessions + todayCompletedSessions;
    
  return Math.round((adjustedTotalSessions / totalDaysWithActivity) * 10) / 10;
};
