
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
      
      console.log('Fetching daily productivity data for user:', userId);
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('created_at, duration, completed')
        .eq('user_id', userId)
        .gte('created_at', startOfDay.toISOString())
        .eq('session_type', 'work')
        .eq('completed', true);

      if (error) {
        console.error('Error fetching productivity data:', error);
        throw error;
      }

      // Group sessions by hour
      const hourlyData: Record<number, {sessions: number, minutes: number}> = {};
      
      // Initialize all hours of the day
      for (let i = 0; i < 24; i++) {
        hourlyData[i] = { sessions: 0, minutes: 0 };
      }

      if (data && data.length > 0) {
        console.log('Raw focus sessions data:', data);
        
        data.forEach(session => {
          const sessionDate = new Date(session.created_at);
          const hour = sessionDate.getHours();
          
          // Only count completed sessions
          if (session.completed) {
            hourlyData[hour].sessions += 1;
            // Convert seconds to minutes for display
            const sessionMinutes = Math.floor(session.duration / 60);
            // Cap minutes at 60 per session as a sanity check
            const cappedMinutes = Math.min(sessionMinutes, 60);
            hourlyData[hour].minutes += cappedMinutes;
          }
        });
      }

      // Format data for chart
      const result = Object.entries(hourlyData)
        .map(([hour, data]) => ({
          name: `${hour}`,
          sessions: data.sessions,
          minutes: data.minutes
        }));
        
      console.log('Processed hourly productivity data:', result);
      return result;
    } catch (error: any) {
      console.error('Error in useDailyProductivity:', error.message);
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
