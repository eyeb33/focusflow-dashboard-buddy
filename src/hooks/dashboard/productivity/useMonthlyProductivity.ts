
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductivityDataPoint } from './types';

export const useMonthlyProductivity = (userId: string | undefined) => {
  const fetchMonthlyProductivity = async (): Promise<ProductivityDataPoint[]> => {
    try {
      if (!userId) return [];
      
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('created_at, duration, completed')
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString())
        .eq('session_type', 'work');

      if (error) throw error;

      // Group sessions by day of month
      const dailyData: Record<number, {sessions: number, minutes: number}> = {};
      
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        dailyData[i] = { sessions: 0, minutes: 0 };
      }

      data?.forEach(session => {
        const dayOfMonth = new Date(session.created_at).getDate();
        if (session.completed) {
          dailyData[dayOfMonth].sessions += 1;
          dailyData[dayOfMonth].minutes += Math.floor(session.duration / 60);
        }
      });

      // Format data for chart
      return Object.entries(dailyData)
        .map(([day, data]) => ({
          name: `${day}`,
          sessions: data.sessions,
          minutes: data.minutes
        }));
    } catch (error: any) {
      console.error('Error fetching monthly productivity:', error.message);
      return [];
    }
  };

  return useQuery({
    queryKey: ['productivity', 'monthly', userId],
    queryFn: fetchMonthlyProductivity,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
