
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductivityDataPoint } from './types';

export const useDailyProductivity = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['dailyProductivity', userId],
    queryFn: async (): Promise<ProductivityDataPoint[]> => {
      if (!userId) return [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const startOfDay = today.toISOString();
      const endTimeStr = endOfDay.toISOString();
      
      console.log(`Fetching daily productivity from ${startOfDay} to ${endTimeStr}`);

      // Get all completed work sessions for today
      const { data: sessions, error } = await supabase
        .from('focus_sessions')
        .select('created_at, duration')
        .eq('user_id', userId)
        .eq('session_type', 'work')
        .eq('completed', true)
        .gte('created_at', startOfDay)
        .lte('created_at', endTimeStr)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching daily productivity:", error);
        return [];
      }

      // Initialize hours array (0-23)
      const hoursMap: Record<string, { minutes: number, sessions: number }> = {};
      for (let i = 0; i < 24; i++) {
        hoursMap[i.toString()] = { minutes: 0, sessions: 0 };
      }

      // Process sessions
      sessions?.forEach(session => {
        const sessionDate = new Date(session.created_at);
        const hour = sessionDate.getHours().toString();
        
        // Cap the minutes per session at 60 to prevent unreasonable values
        const minutesInSession = Math.min(Math.floor((session.duration || 0) / 60), 60);
        
        hoursMap[hour].minutes += minutesInSession;
        hoursMap[hour].sessions += 1;
      });

      // Format data for the chart
      const result: ProductivityDataPoint[] = Object.keys(hoursMap).map(hour => ({
        name: hour,
        minutes: hoursMap[hour].minutes,
        sessions: hoursMap[hour].sessions
      }));

      console.log('Daily productivity data:', result);
      
      // Calculate total sessions and minutes for verification
      const totalSessions = result.reduce((sum, point) => sum + point.sessions, 0);
      const totalMinutes = result.reduce((sum, point) => sum + point.minutes, 0);
      console.log(`Daily totals - sessions: ${totalSessions}, minutes: ${totalMinutes}`);
      
      return result;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
