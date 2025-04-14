
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductivityDataPoint } from './types';

export const useDailyProductivity = (userId: string | undefined) => {
  const fetchDailyProductivity = async (): Promise<ProductivityDataPoint[]> => {
    try {
      if (!userId) return [];
      
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('created_at, duration, completed')
        .eq('user_id', userId)
        .gte('created_at', startOfDay.toISOString())
        .eq('session_type', 'work');

      if (error) throw error;

      // Group sessions by hour
      const hourlyData: Record<number, {sessions: number, minutes: number}> = {};
      
      for (let i = 0; i < 24; i++) {
        hourlyData[i] = { sessions: 0, minutes: 0 };
      }

      data?.forEach(session => {
        const hour = new Date(session.created_at).getHours();
        if (session.completed) {
          hourlyData[hour].sessions += 1;
          hourlyData[hour].minutes += Math.floor(session.duration / 60);
        }
      });

      // Format data for chart
      return Object.entries(hourlyData)
        .map(([hour, data]) => ({
          name: `${hour}:00`,
          sessions: data.sessions,
          minutes: data.minutes
        }));
    } catch (error: any) {
      console.error('Error fetching daily productivity:', error.message);
      return [];
    }
  };

  return useQuery({
    queryKey: ['productivity', 'daily', userId],
    queryFn: fetchDailyProductivity,
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
  });
};
