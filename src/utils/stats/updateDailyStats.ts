
import { supabase } from '@/integrations/supabase/client';
import { calculateStreak } from '../streak/calculateStreak';
import { updateProductivityScore } from '../productivity/updateProductivityScore';

/**
 * Updates daily statistics for a user's focus sessions
 * @param userId The user ID
 * @param durationMinutes The duration in minutes
 * @param sessionType The type of session (work, break, longBreak)
 * @param sessionDate The date to attribute the session to (YYYY-MM-DD)
 */
export const updateDailyStats = async (
  userId: string, 
  durationMinutes: number, 
  sessionType: 'work' | 'break' | 'longBreak' = 'work',
  sessionDate?: string
) => {
  try {
    if (!userId) {
      console.error('Cannot update daily stats: No user ID provided');
      return;
    }
    
    // Only update stats for work sessions
    if (sessionType !== 'work') {
      console.log(`Skipping stats update for non-work session type: ${sessionType}`);
      return;
    }
    
    // Ensure durationMinutes is a reasonable value (cap at 60 minutes per session as a safety check)
    const normalizedDuration = Math.min(durationMinutes, 60);
    console.log(`Updating daily stats with normalized duration: ${normalizedDuration} minutes for user ${userId}`);
    
    // Use the provided date or today's date
    const today = sessionDate || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    console.log(`Attribution date for session stats: ${today}`);
    
    const { data: existingData, error: queryError } = await supabase
      .from('sessions_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();
      
    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 means no rows returned
      throw queryError;
    }
    
    const { data: recentDays, error: streakError } = await supabase
      .from('sessions_summary')
      .select('date, total_completed_sessions')
      .eq('user_id', userId)
      .gt('total_completed_sessions', 0)
      .order('date', { ascending: false });
      
    if (streakError) throw streakError;
    
    // Calculate streak with typed data
    const streakData = recentDays?.map(day => ({
      date: day.date,
      sessions: day.total_completed_sessions
    })) || [];
    
    let currentStreak = calculateStreak(streakData, today);
    console.log(`Current streak for user ${userId}: ${currentStreak} days`);
    
    if (existingData) {
      console.log(`Updating existing sessions_summary for date ${today}:`, existingData);
      const { error } = await supabase
        .from('sessions_summary')
        .update({
          total_sessions: existingData.total_sessions + 1,
          total_focus_time: existingData.total_focus_time + normalizedDuration,
          total_completed_sessions: existingData.total_completed_sessions + 1,
          longest_streak: Math.max(existingData.longest_streak || 0, currentStreak),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id);
        
      if (error) throw error;
    } else {
      console.log(`Creating new sessions_summary for date ${today}`);
      const { error } = await supabase
        .from('sessions_summary')
        .insert({
          user_id: userId,
          date: today,
          total_sessions: 1,
          total_focus_time: normalizedDuration,
          total_completed_sessions: 1,
          longest_streak: currentStreak || 1
        });
        
      if (error) throw error;
    }
    
    // Also update the productivity score
    await updateProductivityScore(userId, today);
    console.log(`Productivity score updated for user ${userId} on date ${today}`);
    
  } catch (error) {
    console.error('Error updating daily stats:', error);
  }
};
