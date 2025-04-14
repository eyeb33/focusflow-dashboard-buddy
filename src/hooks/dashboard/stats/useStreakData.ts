
import { supabase } from '@/integrations/supabase/client';
import { calculateStreak } from '@/utils/streak/calculateStreak';

interface StreakResult {
  currentStreak: number;
  bestStreak: number;
}

export const fetchStreakData = async (userId: string, today: string): Promise<StreakResult> => {
  // Get current streak and best streak
  const { data: summaryData, error: summaryError } = await supabase
    .from('sessions_summary')
    .select('longest_streak, total_sessions, total_focus_time, date, total_completed_sessions')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(30);

  if (summaryError) {
    console.error('Error fetching streak data:', summaryError);
    return { currentStreak: 0, bestStreak: 0 };
  }
  
  // Calculate current streak
  let currentStreak = 0;
  if (summaryData && summaryData.length > 0) {
    // Check if there's data for recent days
    const hasEntryToday = summaryData.some(day => day.date === today);
    
    // Calculate streak based on recent days data
    const recentDays = summaryData.map(day => ({
      date: day.date,
      sessions: day.total_completed_sessions
    }));
    
    currentStreak = calculateStreak(recentDays, today);
  }
  
  // Find best streak (maximum longest_streak value)
  const bestStreakValue = summaryData?.reduce((max: number, day: any) => 
    Math.max(max, day.longest_streak || 0), 0) || 0;

  return {
    currentStreak: Math.max(1, currentStreak), // Ensure streak is at least 1 if we have data for today
    bestStreak: Math.max(bestStreakValue, currentStreak) // Update best streak if current is higher
  };
};
