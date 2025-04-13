
import { supabase } from '@/integrations/supabase/client';

/**
 * Resets a user's session count and other stats for testing purposes
 * @param userId The ID of the user whose stats to reset
 */
export async function resetUserStats(userId: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Update today's session summary to reset count
    const { error: summaryError } = await supabase
      .from('sessions_summary')
      .upsert({
        user_id: userId,
        date: today,
        total_completed_sessions: 0,
        total_focus_time: 0,
        total_sessions: 0
      }, { onConflict: 'user_id,date' });
      
    if (summaryError) {
      console.error('Error resetting session summary:', summaryError);
      return false;
    }
    
    // Delete today's focus sessions for a clean slate
    const startOfDay = new Date(today);
    const { error: deleteError } = await supabase
      .from('focus_sessions')
      .delete()
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString());
      
    if (deleteError) {
      console.error('Error deleting focus sessions:', deleteError);
      return false;
    }
    
    console.log('Successfully reset user stats for testing');
    return true;
  } catch (error) {
    console.error('Error resetting user stats:', error);
    return false;
  }
}
