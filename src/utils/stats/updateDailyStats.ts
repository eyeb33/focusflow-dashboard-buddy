
import { supabase } from '@/integrations/supabase/client';
import { calculateStreak } from '../streak/calculateStreak';
import { updateProductivityScore } from '../productivity/updateProductivityScore';

/**
 * Updates daily statistics for a user's focus sessions
 */
export const updateDailyStats = async (userId: string, durationMinutes: number, sessionType: 'work' | 'break' | 'longBreak' = 'work') => {
  try {
    if (!userId) return;
    
    // Only update stats for work sessions
    if (sessionType !== 'work') return;
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const { data: existingData, error: queryError } = await supabase
      .from('sessions_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();
      
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
    
    if (existingData) {
      const { error } = await supabase
        .from('sessions_summary')
        .update({
          total_sessions: existingData.total_sessions + 1,
          total_focus_time: existingData.total_focus_time + durationMinutes,
          total_completed_sessions: existingData.total_completed_sessions + 1,
          longest_streak: Math.max(existingData.longest_streak || 0, currentStreak),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id);
        
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('sessions_summary')
        .insert({
          user_id: userId,
          date: today,
          total_sessions: 1,
          total_focus_time: durationMinutes,
          total_completed_sessions: 1,
          longest_streak: currentStreak || 1
        });
        
      if (error) throw error;
    }
    
    await updateProductivityScore(userId, today);
    
  } catch (error) {
    console.error('Error updating daily stats:', error);
  }
};
