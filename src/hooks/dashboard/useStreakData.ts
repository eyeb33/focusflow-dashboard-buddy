
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
      
      if (summaryData && summaryData.length > 0) {
        // Convert to StreakDay format
        const processedData = summaryData.map(day => ({
          date: day.date,
          completed: day.total_completed_sessions || 0
        }));
        
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
      } 
      
      // Fallback to calculating from individual sessions
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('created_at, duration, completed')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('session_type', 'work')
        .eq('completed', true);

      if (error) throw error;

      // Process sessions into days with completion counts
      const sessionsByDay: Record<string, number> = {};
      
      data?.forEach(session => {
        const date = new Date(session.created_at).toISOString().split('T')[0];
        sessionsByDay[date] = (sessionsByDay[date] || 0) + 1;
      });

      // Generate last 28 days, filling in zeros for days with no data
      const result: StreakDay[] = [];
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
    staleTime: 60 * 1000, // 1 minute - reduced for more up-to-date data
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
