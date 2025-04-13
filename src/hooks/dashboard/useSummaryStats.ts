
import { supabase } from '@/integrations/supabase/client';
import { calculateStreak } from '@/utils/streak/calculateStreak';

export interface SummaryData {
  totalSessions: number;
  totalFocusMinutes: number;
  activeDaysCount: number;
  completedSessions: number;
  currentStreak: number;
  bestStreak: number;
}

/**
 * Function to fetch summary stats for a user
 */
export const fetchSummaryData = async (userId: string): Promise<SummaryData | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch summary data
    const { data: summaryData, error: summaryError } = await supabase
      .from('sessions_summary')
      .select('longest_streak, total_sessions, total_focus_time, date, total_completed_sessions')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(30);
      
    if (summaryError) {
      console.error('Error fetching summary data:', summaryError);
      throw summaryError;
    }
    
    // Calculate current streak based on consecutive days with activity
    const recentDays = summaryData?.map(day => ({
      date: day.date,
      sessions: day.total_completed_sessions
    })) || [];
    
    const currentStreak = calculateStreak(recentDays, today);
    
    // Find best streak (maximum longest_streak value)
    const bestStreakValue = summaryData?.reduce((max: number, day: any) => 
      Math.max(max, day.longest_streak || 0), currentStreak) || currentStreak;
    
    // Calculate daily average from days with activity (not total days in range)
    const activeDaysCount = summaryData?.filter(day => day.total_completed_sessions > 0).length || 1;
    const totalCompletedSessions = summaryData?.reduce((acc, day) => 
      acc + (day.total_completed_sessions || 0), 0) || 0;
    const totalFocusMinutes = summaryData?.reduce((acc, day) => 
      acc + (day.total_focus_time || 0), 0) || 0;
    const totalSessions = summaryData?.reduce((acc, day) => 
      acc + (day.total_sessions || 0), 0) || 0;
      
    return {
      totalSessions,
      totalFocusMinutes,
      activeDaysCount,
      completedSessions: totalCompletedSessions,
      currentStreak,
      bestStreak: bestStreakValue
    };
  } catch (error) {
    console.error('Error fetching summary data:', error);
    return null;
  }
};
