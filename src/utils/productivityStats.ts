
import { supabase } from '@/integrations/supabase/client';

/**
 * Updates the daily stats for a user when they complete a focus session
 * @param userId The ID of the user to update stats for
 * @param focusMinutes The number of minutes to add to total focus time
 */
export const updateDailyStats = async (userId: string, focusMinutes: number) => {
  try {
    if (!userId) {
      console.error('Cannot update daily stats: No user ID provided');
      return false;
    }
    
    console.log(`Updating daily stats for user ${userId} with ${focusMinutes} minutes`);
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Check if the user already has a summary record for today
    const { data: existingData, error: checkError } = await supabase
      .from('sessions_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing summary:', checkError);
      return false;
    }
    
    // Create or update the summary record
    if (existingData) {
      // Update existing summary
      console.log('Updating existing summary record:', existingData);
      
      const { error: updateError } = await supabase
        .from('sessions_summary')
        .update({
          total_completed_sessions: existingData.total_completed_sessions + 1,
          total_focus_time: existingData.total_focus_time + focusMinutes,
          total_sessions: existingData.total_sessions + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id);
        
      if (updateError) {
        console.error('Error updating daily summary:', updateError);
        return false;
      }
      
      console.log(`Successfully updated daily summary: sessions=${existingData.total_completed_sessions + 1}, minutes=${existingData.total_focus_time + focusMinutes}`);
    } else {
      // Create new summary record
      console.log('Creating new summary record for today');
      
      const { error: insertError } = await supabase
        .from('sessions_summary')
        .insert({
          user_id: userId,
          date: today,
          total_completed_sessions: 1,
          total_focus_time: focusMinutes,
          total_sessions: 1
        });
        
      if (insertError) {
        console.error('Error creating daily summary:', insertError);
        return false;
      }
      
      console.log(`Successfully created new daily summary: sessions=1, minutes=${focusMinutes}`);
    }
    
    return true;
  } catch (error) {
    console.error('Exception during daily stats update:', error);
    return false;
  }
};
