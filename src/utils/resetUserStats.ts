
import { supabase } from '@/integrations/supabase/client';

/**
 * Resets a user's stats for testing purposes
 * @param userId The ID of the user whose stats to reset
 */
export async function resetUserStats(userId: string): Promise<boolean> {
  if (!userId) {
    console.error('Cannot reset user stats: No user ID provided');
    return false;
  }
  
  try {
    console.log(`Resetting ALL stats for user ${userId}`);
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Reset today's session summary
    const { error: summaryError } = await supabase
      .from('sessions_summary')
      .upsert({
        user_id: userId,
        date: today,
        total_completed_sessions: 0,
        total_focus_time: 0,
        total_sessions: 0,
        longest_streak: 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,date' });
      
    if (summaryError) {
      console.error('Error resetting session summary:', summaryError);
      return false;
    }
    
    // 2. Delete all focus sessions
    const { error: deleteError } = await supabase
      .from('focus_sessions')
      .delete()
      .eq('user_id', userId);
      
    if (deleteError) {
      console.error('Error deleting focus sessions:', deleteError);
      return false;
    }
    
    // 3. Reset productivity trends
    const { error: trendsError } = await supabase
      .from('productivity_trends')
      .delete()
      .eq('user_id', userId);
      
    if (trendsError) {
      console.error('Error resetting productivity trends:', trendsError);
      return false;
    }
    
    console.log('Successfully reset ALL user stats for testing');
    return true;
  } catch (error) {
    console.error('Exception during user stats reset:', error);
    return false;
  }
}
