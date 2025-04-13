
import { useQuery } from '@tanstack/react-query';
import { fetchSummaryData } from './useSummaryStats';
import { calculateWeeklyChanges } from './useWeeklyChanges';

export interface StatsData {
  totalSessions: number;
  totalMinutes: number;
  dailyAverage: number;
  currentStreak: number;
  bestStreak: number;
  weeklyChange: {
    sessions: number;
    minutes: number;
    dailyAvg: number;
    isPositive: boolean;
  };
}

/**
 * Hook to fetch and calculate user statistics for the dashboard
 */
export const useStatsData = (userId: string | undefined) => {
  const fetchTotalStats = async (): Promise<StatsData | null> => {
    try {
      if (!userId) {
        console.error('No user ID available for fetching stats');
        return null;
      }
      
      console.log('Fetching total stats for user:', userId);
      
      // Fetch summary data
      const summaryData = await fetchSummaryData(userId);
      if (!summaryData) {
        console.log('No summary data found');
        return null;
      }
      
      console.log('Summary data received:', summaryData);
      
      // Calculate weekly change data for trends
      const weeklyChanges = await calculateWeeklyChanges(userId);
      
      // Calculate daily average based on minutes per day
      const dailyAverage = summaryData.activeDaysCount > 0 
        ? Math.round((summaryData.totalFocusMinutes / summaryData.activeDaysCount) * 10) / 10 
        : 0;
      
      return {
        // Use completedSessions instead of totalSessions to show only completed focus sessions
        totalSessions: summaryData.completedSessions,
        totalMinutes: summaryData.totalFocusMinutes,
        dailyAverage,
        currentStreak: summaryData.currentStreak,
        bestStreak: summaryData.bestStreak,
        weeklyChange: weeklyChanges
      };
    } catch (error: any) {
      console.error('Error fetching stats:', error.message);
      return null;
    }
  };

  const result = useQuery({
    queryKey: ['stats', userId],
    queryFn: fetchTotalStats,
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute before considering data stale
  });

  return {
    stats: result.data ?? {
      totalSessions: 0,
      totalMinutes: 0,
      dailyAverage: 0,
      currentStreak: 0,
      bestStreak: 0,
      weeklyChange: {
        sessions: 0,
        minutes: 0,
        dailyAvg: 0,
        isPositive: true
      }
    },
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch
  };
};
