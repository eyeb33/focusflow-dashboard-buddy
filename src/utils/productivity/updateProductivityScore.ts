
import { supabase } from '@/integrations/supabase/client';
import { generateInsights } from '../insights/generateInsights';

/**
 * Updates productivity score based on completed sessions and total duration
 */
export const updateProductivityScore = async (userId: string, date: string) => {
  try {
    if (!userId) return;
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_type', 'work')
      .like('created_at', `${date}%`);
      
    if (sessionsError) throw sessionsError;
    
    const completedSessions = sessions.filter(s => s.completed).length;
    const totalDurationMinutes = sessions
      .filter(s => s.completed)
      .reduce((total, session) => total + (session.duration / 60), 0);
    
    const score = Math.min(
      100,
      (completedSessions * 10) + Math.floor(totalDurationMinutes / 3)
    );
    
    const { data: existingTrend, error: trendError } = await supabase
      .from('productivity_trends')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .single();
      
    if (trendError && trendError.code !== 'PGRST116') {
      throw trendError;
    }
    
    if (existingTrend) {
      await supabase
        .from('productivity_trends')
        .update({
          productivity_score: score
        })
        .eq('id', existingTrend.id);
    } else {
      await supabase
        .from('productivity_trends')
        .insert({
          user_id: userId,
          date: date,
          productivity_score: score
        });
    }
    
    if (completedSessions >= 3) {
      await generateInsights(userId, completedSessions, totalDurationMinutes);
    }
    
  } catch (error) {
    console.error('Error updating productivity score:', error);
  }
};
