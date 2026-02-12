
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
      
      // Get sessions summary for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      
      // First try to get data from sessions_summary table (more reliable)
      const { data: summaryData, error: summaryError } = await supabase
        .from('sessions_summary')
        .select('date, total_completed_sessions')
        .eq('user_id', userId)
        .gte('date', thirtyDaysAgoStr)
        .order('date', { ascending: false });
        
      if (summaryError) {
        console.error("Error fetching sessions summary data:", summaryError);
        throw summaryError;
      }
      
      // For today's data, always get the latest directly from focus_sessions
      // to ensure we have the most up-to-date count
      const today = new Date().toISOString().split('T')[0];
      const { data: todaySessions, error: todayError } = await supabase
        .from('focus_sessions')
        .select('id, created_at')
        .eq('user_id', userId)
        .eq('session_type', 'work')
        .eq('completed', true)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59.999`);

      if (todayError) {
        console.error("Error fetching today's sessions:", todayError);
      }
      
      // Convert to StreakDay format, with special handling for today
      const processedData = summaryData?.map(day => {
        // For today, use the direct focus_sessions count
        if (day.date === today && todaySessions) {
          return {
            date: day.date,
            completed: todaySessions.length
          };
        }
        
        return {
          date: day.date,
          completed: day.total_completed_sessions || 0
        };
      }) || [];
      
      // Check if today is missing
      const hasToday = processedData.some(day => day.date === today);
      if (!hasToday && todaySessions) {
        processedData.push({
          date: today,
          completed: todaySessions.length
        });
      }
      
      // Generate all days in the last 28 days
      const result: StreakDay[] = [];
      for (let i = 28; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Find if we have data for this day
        const dayData = processedData.find(d => d.date === dateStr);
        
        result.push({
          date: dateStr,
          completed: dayData ? dayData.completed : 0
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
    staleTime: 30 * 1000, // 30 seconds - reduced for more up-to-date data
    refetchOnWindowFocus: true // Refetch when window focus changes
  });

  return {
    streakData: result.data || [],
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch
  };
};
