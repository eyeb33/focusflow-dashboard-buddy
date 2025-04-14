
import { useQuery } from '@tanstack/react-query';
import { StatsData, initialStatsData } from './stats/statsTypes';
import { fetchWeeklyChangeData } from './stats/useWeeklyChangeData';
import { fetchStreakData } from './stats/useStreakData';
import { fetchDailyAverageData } from './stats/useDailyAverageData';
import { fetchTotalMetrics } from './stats/useTotalMetrics';

export type { StatsData } from './stats/statsTypes';

export const useStatsData = (userId: string | undefined) => {
  const fetchTotalStats = async (): Promise<StatsData | null> => {
    try {
      if (!userId) {
        console.error('No user ID available for fetching stats');
        return null;
      }
      
      console.log('Fetching total stats for user:', userId);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch all data concurrently for better performance
      const [
        totalMetrics,
        dailyAverage,
        streakData,
        weeklyChangeData
      ] = await Promise.all([
        fetchTotalMetrics(userId, today),
        fetchDailyAverageData(userId, today),
        fetchStreakData(userId, today),
        fetchWeeklyChangeData(userId)
      ]);
      
      return {
        totalSessions: totalMetrics.totalSessions,
        totalMinutes: totalMetrics.totalMinutes,
        dailyAverage,
        currentStreak: streakData.currentStreak,
        bestStreak: streakData.bestStreak,
        weeklyChange: {
          sessions: weeklyChangeData.sessionsChange,
          minutes: weeklyChangeData.minutesChange,
          dailyAvg: weeklyChangeData.dailyAvgChange,
          isPositive: weeklyChangeData.isPositive
        }
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
    staleTime: 5 * 60 * 1000, // 5 minutes before considering data stale
  });

  return {
    stats: result.data ?? initialStatsData,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch
  };
};
