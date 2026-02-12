
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { StatsData, initialStatsData } from './stats/statsTypes';
import { fetchWeeklyChangeData } from './stats/useWeeklyChangeData';
import { fetchStreakData } from './stats/fetchCurrentStreak';
import { fetchDailyAverageData } from './stats/useDailyAverageData';
import { fetchTotalMetrics } from './stats/useTotalMetrics';
import { fetchWeeklyStats, fetchMonthlyStats } from './stats/usePeriodStats';
import { calculateAllTrends } from './stats/useTrendCalculations';

export type { StatsData } from './stats/statsTypes';

export const useStatsData = (userId: string | undefined) => {
  const currentDateRef = useRef<string>(new Date().toISOString().split('T')[0]);

  const fetchTotalStats = async (): Promise<StatsData | null> => {
    try {
      if (!userId) {
        console.error('No user ID available for fetching stats');
        return null;
      }

      const today = new Date().toISOString().split('T')[0];
      currentDateRef.current = today;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const [
        todayMetrics,
        yesterdayMetrics,
        weeklyStats,
        lastWeekStats,
        monthlyStats,
        lastMonthStats,
        dailyAverage,
        streakData,
        weeklyChangeData
      ] = await Promise.all([
        fetchTotalMetrics(userId, today),
        fetchTotalMetrics(userId, yesterdayStr),
        fetchWeeklyStats(userId),
        fetchWeeklyStats(userId),
        fetchMonthlyStats(userId),
        fetchMonthlyStats(userId),
        fetchDailyAverageData(userId, today),
        fetchStreakData(userId, today),
        fetchWeeklyChangeData(userId)
      ]);

      const trends = calculateAllTrends(
        todayMetrics,
        yesterdayMetrics,
        weeklyStats,
        lastWeekStats,
        monthlyStats,
        lastMonthStats
      );

      return {
        totalSessions: todayMetrics.totalSessions,
        totalMinutes: todayMetrics.totalMinutes,
        completedCycles: 0,
        dailyAverage,
        currentStreak: streakData.currentStreak,
        bestStreak: streakData.bestStreak,
        weeklyChange: weeklyChangeData,
        weeklyStats: {
          ...weeklyStats,
          sessionsTrend: trends.weeklySessionsTrend,
          minutesTrend: trends.weeklyMinutesTrend
        },
        monthlyStats: {
          ...monthlyStats,
          sessionsTrend: trends.monthlySessionsTrend,
          minutesTrend: trends.monthlyMinutesTrend
        },
        dailyStats: {
          sessionsTrend: trends.dailySessionsTrend,
          minutesTrend: trends.dailyMinutesTrend
        }
      };
    } catch (error: any) {
      console.error('Error fetching stats:', error.message);
      return null;
    }
  };

  const result = useQuery({
    queryKey: ['stats', userId, currentDateRef.current],
    queryFn: fetchTotalStats,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!userId) return;
    
    const intervalId = setInterval(() => {
      const currentDate = new Date().toISOString().split('T')[0];
      if (currentDate !== currentDateRef.current) {
        console.log('Date changed from', currentDateRef.current, 'to', currentDate, '- invalidating and refetching dashboard stats');
        currentDateRef.current = currentDate;
        result.refetch();
      }
    }, 60000); // Check every minute

    const refreshInterval = setInterval(() => {
      console.log('Periodic refresh of dashboard stats');
      result.refetch();
    }, 30 * 60 * 1000); // Every 30 minutes

    return () => {
      clearInterval(intervalId);
      clearInterval(refreshInterval);
    };
  }, [userId, result.refetch]);

  return {
    stats: result.data ?? initialStatsData,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch
  };
};
