
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
    // Filter days with at least 1 completed session
    const recentDays = summaryData
      .filter(day => day.total_completed_sessions > 0)
      .map(day => ({
        date: day.date,
        sessions: day.total_completed_sessions
      }));
    
    // Use the passed in today parameter or get today's date in YYYY-MM-DD format
    const actualToday = today || new Date().toISOString().split('T')[0];
    console.log('Calculating streak with today as:', actualToday);
    
    currentStreak = calculateStreak(recentDays, actualToday);
  }
  
  // Find best streak (maximum longest_streak value)
  const bestStreakValue = summaryData?.reduce((max: number, day: any) => 
    Math.max(max, day.longest_streak || 0), 0) || 0;
  
  // Update longest streak in database if current streak is higher
  if (currentStreak > bestStreakValue && userId) {
    const today = new Date().toISOString().split('T')[0];
    const { error: updateError } = await supabase
      .from('sessions_summary')
      .upsert({
        user_id: userId,
        date: today,
        longest_streak: currentStreak
      }, { onConflict: 'user_id,date' });
      
    if (updateError) {
      console.error('Error updating longest streak:', updateError);
    }
  }

  return {
    currentStreak: currentStreak || 0, // Ensure streak is at least 0
    bestStreak: Math.max(bestStreakValue, currentStreak) // Update best streak if current is higher
  };
};
