
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StreakDay {
  date: string;
  completed: number;
}

export const useStreakData = (userId: string | undefined) => {
  const fetchStreakData = async (): Promise<StreakDay[]> => {
    try {
      if (!userId) return [];
      
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

      return result;
    } catch (error: any) {
      console.error('Error fetching streak data:', error.message);
      return [];
    }
  };

  const result = useQuery({
    queryKey: ['streakData', userId],
    queryFn: fetchStreakData,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    streakData: result.data || [],
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch
  };
};
