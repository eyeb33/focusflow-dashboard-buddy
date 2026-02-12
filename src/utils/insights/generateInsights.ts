
import { supabase } from '@/integrations/supabase/client';

/**
 * Generates insights based on user's productivity data
 */
export const generateInsights = async (userId: string, sessionsCount: number, durationMinutes: number) => {
  try {
    if (!userId) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existingInsights, error: insightError } = await supabase
      .from('insights')
      .select('created_at')
      .eq('user_id', userId)
      .like('created_at', `${today}%`)
      .order('created_at', { ascending: false });
      
    if (insightError) throw insightError;
    
    if (existingInsights && existingInsights.length === 0) {
      let title = '';
      let content = '';
      
      if (sessionsCount >= 8) {
        title = 'Productive Day!';
        content = `You've completed ${sessionsCount} focus sessions today for a total of ${Math.round(durationMinutes)} minutes. That's impressive dedication!`;
      } else if (sessionsCount >= 5) {
        title = 'Great Progress Today';
        content = `With ${sessionsCount} completed sessions, you're making excellent progress. Keep it up!`;
      } else {
        title = 'Building Momentum';
        content = `You've completed ${sessionsCount} focus sessions today. Each session helps build your productivity habits.`;
      }
      
      await supabase
        .from('insights')
        .insert({
          user_id: userId,
          title: title,
          content: content
        });
    }
  } catch (error) {
    console.error('Error generating insights:', error);
  }
};
