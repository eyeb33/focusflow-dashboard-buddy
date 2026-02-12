
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductivityDataPoint } from './types';

export const useWeeklyProductivity = (userId: string | undefined) => {
  const fetchWeeklyProductivity = async (): Promise<ProductivityDataPoint[]> => {
    try {
      if (!userId) return [];
      
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('created_at, duration, completed')
        .eq('user_id', userId)
        .gte('created_at', startOfWeek.toISOString())
        .eq('session_type', 'work');

      if (error) throw error;

      // Group sessions by day of week
      const dailyData: Record<number, {sessions: number, minutes: number}> = {};
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      for (let i = 0; i < 7; i++) {
        dailyData[i] = { sessions: 0, minutes: 0 };
      }

      data?.forEach(session => {
        const dayOfWeek = new Date(session.created_at).getDay();
        if (session.completed) {
          dailyData[dayOfWeek].sessions += 1;
          dailyData[dayOfWeek].minutes += Math.floor(session.duration / 60);
        }
      });

      // Format data for chart
      return Object.entries(dailyData)
        .map(([day, data]) => ({
          name: dayNames[parseInt(day)],
          sessions: data.sessions,
          minutes: data.minutes
        }));
    } catch (error: any) {
      console.error('Error fetching weekly productivity:', error.message);
      return [];
    }
  };

  return useQuery({
    queryKey: ['productivity', 'weekly', userId],
    queryFn: fetchWeeklyProductivity,
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
