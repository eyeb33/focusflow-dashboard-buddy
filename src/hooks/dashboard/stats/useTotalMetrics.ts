
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
    
    // Always fetch the actual sessions data to ensure accuracy
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    const { data: todaySessions, error: sessionError } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
      .eq('session_type', 'work') // Only count work sessions
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    if (sessionError) {
      console.error('Error fetching today sessions:', sessionError);
      // If we have summary data, use it as a fallback
      if (todaySummary) {
        return { 
          totalSessions: todaySummary.total_completed_sessions || 0, 
          totalMinutes: todaySummary.total_focus_time || 0 
        };
      }
      return { totalSessions: 0, totalMinutes: 0 };
    }

    // If we have actual session data, use that for the calculation
    if (todaySessions && todaySessions.length > 0) {
      // Count the number of sessions
      const totalSessions = todaySessions.length;
      
      // Calculate total minutes directly from individual sessions
      const totalMinutes = todaySessions.reduce((sum, session) => 
        sum + Math.min(Math.floor((session.duration || 0) / 60), 60), 0);

      console.log(`Daily totals - sessions: ${totalSessions}, minutes: ${totalMinutes}`);
      
      return { 
        totalSessions, 
        totalMinutes 
      };
    } else if (todaySummary) {
      // If no session data but we have summary data, use it
      // Apply a sanity check on the values
      const sessions = todaySummary.total_completed_sessions || 0;
      let minutes = todaySummary.total_focus_time || 0;
      const maxReasonableMinutes = sessions * 60;
      
      // If minutes are unreasonably high, cap them
      if (sessions > 0 && minutes > maxReasonableMinutes) {
        console.warn(`Detected unreasonable focus time: ${minutes} minutes for ${sessions} sessions. Capping to ${maxReasonableMinutes}`);
        minutes = maxReasonableMinutes;
      }
      
      return { 
        totalSessions: sessions, 
        totalMinutes: minutes 
      };
    }
    
    // No data found
    return { totalSessions: 0, totalMinutes: 0 };
  } catch (error) {
    console.error('Error in fetchTotalMetrics:', error);
    return { totalSessions: 0, totalMinutes: 0 };
  }
};
