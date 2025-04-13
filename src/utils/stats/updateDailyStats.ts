
import { supabase } from '@/integrations/supabase/client';
import { calculateStreak } from '../streak/calculateStreak';
import { updateProductivityScore } from '../productivity/updateProductivityScore';

/**
 * Updates daily statistics for a user's focus sessions
 */
export const updateDailyStats = async (userId: string, durationMinutes: number) => {
  try {
    if (!userId) return;
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    console.log(`Updating daily stats for user ${userId} with ${durationMinutes} minutes on ${today}`);
    
    const { data: existingData, error: queryError } = await supabase
      .from('sessions_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();
      
    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.error('Error querying sessions summary:', queryError);
      throw queryError;
    }
    
    // Get recent days with activity to calculate current streak
    const { data: recentDays, error: streakError } = await supabase
      .from('sessions_summary')
      .select('date, total_completed_sessions')
      .eq('user_id', userId)
      .gt('total_completed_sessions', 0)
      .order('date', { ascending: false });
      
    if (streakError) {
      console.error('Error fetching streak data:', streakError);
      throw streakError;
    }
    
    console.log('Recent days with activity:', recentDays);
    let currentStreak = calculateStreak(recentDays, today);
    console.log(`Current streak calculated: ${currentStreak} days`);
    
    if (existingData) {
      console.log('Updating existing session summary:', existingData);
      const { error } = await supabase
        .from('sessions_summary')
        .update({
          total_sessions: existingData.total_sessions + 1,
          total_focus_time: existingData.total_focus_time + durationMinutes,
          total_completed_sessions: existingData.total_completed_sessions + 1,
          longest_streak: Math.max(existingData.longest_streak, currentStreak),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id);
        
      if (error) {
        console.error('Error updating sessions summary:', error);
        throw error;
      }
      
      console.log('Updated session summary successfully');
    } else {
      console.log('Creating new session summary for today');
      const { error } = await supabase
        .from('sessions_summary')
        .insert({
          user_id: userId,
          date: today,
          total_sessions: 1,
          total_focus_time: durationMinutes,
          total_completed_sessions: 1,
          longest_streak: currentStreak
        });
        
      if (error) {
        console.error('Error inserting new sessions summary:', error);
        throw error;
      }
      
      console.log('Created new session summary successfully');
    }
    
    // Update productivity score based on completed sessions and focus time
    await updateProductivityScore(userId, today);
    console.log('Updated productivity score successfully');
    
  } catch (error) {
    console.error('Error updating daily stats:', error);
  }
};
