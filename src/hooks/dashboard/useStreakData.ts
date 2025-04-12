
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StreakDay {
  date: string;
  completed: number;
}

export const useStreakData = (userId: string | undefined) => {
  const [streakData, setStreakData] = useState<StreakDay[]>([]);

  const fetchStreakData = async () => {
    try {
      // First, get actual focus sessions by day
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('created_at, duration, completed')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('session_type', 'work');

      if (error) throw error;

      // Process sessions into days with completion counts
      const sessionsByDay: Record<string, number> = {};
      
      data?.forEach(session => {
        const date = new Date(session.created_at).toISOString().split('T')[0];
        if (session.completed) {
          sessionsByDay[date] = (sessionsByDay[date] || 0) + 1;
        }
      });

      // Generate last 28 days, filling in zeros for days with no data
      const result = [];
      for (let i = 28; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        result.push({
          date: dateStr,
          completed: sessionsByDay[dateStr] || 0
        });
      }

      setStreakData(result);
      return result;
    } catch (error: any) {
      console.error('Error fetching streak data:', error.message);
      return [];
    }
  };

  return { streakData, fetchStreakData };
};
