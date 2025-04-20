import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { StatsData, initialStatsData, WeeklyMonthlyStats } from './stats/statsTypes';
import { fetchWeeklyChangeData } from './stats/useWeeklyChangeData';
import { fetchStreakData } from './stats/useStreakData';
import { fetchDailyAverageData } from './stats/useDailyAverageData';
import { fetchTotalMetrics } from './stats/useTotalMetrics';
import { supabase } from '@/integrations/supabase/client';

export type { StatsData } from './stats/statsTypes';

export const useStatsData = (userId: string | undefined) => {
  const currentDateRef = useRef<string>(new Date().toISOString().split('T')[0]);

  const fetchCompletedCycles = async (userId: string, periodStart: Date, periodEnd: Date, sessionsUntilLongBreak: number) => {
    const { data, error } = await supabase
      .from('sessions_summary')
      .select('total_completed_sessions, date')
      .eq('user_id', userId)
      .gte('date', periodStart.toISOString().split('T')[0])
      .lte('date', periodEnd.toISOString().split('T')[0]);

    if (error) {
      console.error("Error fetching sessions_summary for cycles:", error);
      return 0;
    }

    const totalSessions = data?.reduce((sum, day) => sum + (day.total_completed_sessions || 0), 0) || 0;
    return Math.floor(totalSessions / sessionsUntilLongBreak);
  };

  const fetchWeeklyStats = async (userId: string): Promise<WeeklyMonthlyStats> => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString();
    const today = new Date();

    const { data, error } = await supabase
      .from('focus_sessions')
      .select('duration')
      .eq('user_id', userId)
      .eq('session_type', 'work')
      .eq('completed', true)
      .gte('created_at', oneWeekAgoStr);

    let totalSessions = 0;
    let totalMinutes = 0;
    if (!error && Array.isArray(data)) {
      totalSessions = data.length;
      totalMinutes = data.reduce((acc, session) => acc + Math.min(Math.floor((session.duration || 0) / 60), 60), 0);
    }

    const sessionsUntilLongBreak = 4;
    const completedCycles = await fetchCompletedCycles(userId, oneWeekAgo, today, sessionsUntilLongBreak);

    return {
      totalSessions,
      totalMinutes,
      dailyAverage: totalSessions > 0 ? Math.round(totalSessions / 7 * 10) / 10 : 0,
      completedCycles,
    };
  };

  const fetchMonthlyStats = async (userId: string): Promise<WeeklyMonthlyStats> => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneMonthAgoStr = oneMonthAgo.toISOString();
    const today = new Date();

    const { data, error } = await supabase
      .from('focus_sessions')
      .select('duration')
      .eq('user_id', userId)
      .eq('session_type', 'work')
      .eq('completed', true)
      .gte('created_at', oneMonthAgoStr);

    let totalSessions = 0;
    let totalMinutes = 0;
    if (!error && Array.isArray(data)) {
      totalSessions = data.length;
      totalMinutes = data.reduce((acc, session) => acc + Math.min(Math.floor((session.duration || 0) / 60), 60), 0);
    }

    const sessionsUntilLongBreak = 4;
    const completedCycles = await fetchCompletedCycles(userId, oneMonthAgo, today, sessionsUntilLongBreak);

    return {
      totalSessions,
      totalMinutes,
      dailyAverage: totalSessions > 0 ? Math.round(totalSessions / 30 * 10) / 10 : 0,
      completedCycles,
    };
  };

  const fetchTotalStats = async (): Promise<StatsData | null> => {
    try {
      if (!userId) {
        console.error('No user ID available for fetching stats');
        return null;
      }

      const today = new Date().toISOString().split('T')[0];
      currentDateRef.current = today;

      const [
        totalMetrics,
        dailyAverage,
        streakData,
        weeklyChangeData,
        weeklyStats,
        monthlyStats
      ] = await Promise.all([
        fetchTotalMetrics(userId, today),
        fetchDailyAverageData(userId, today),
        fetchStreakData(userId, today),
        fetchWeeklyChangeData(userId),
        fetchWeeklyStats(userId),
        fetchMonthlyStats(userId)
      ]);

      const { totalSessions } = totalMetrics;
      const sessionsUntilLongBreak = 4;
      const completedCycles = Math.floor(totalSessions / sessionsUntilLongBreak);

      return {
        totalSessions: totalMetrics.totalSessions,
        totalMinutes: totalMetrics.totalMinutes,
        completedCycles,
        dailyAverage,
        currentStreak: streakData.currentStreak,
        bestStreak: streakData.bestStreak,
        weeklyChange: {
          sessions: weeklyChangeData.sessionsChange,
          minutes: weeklyChangeData.minutesChange,
          dailyAvg: weeklyChangeData.dailyAvgChange,
          isPositive: weeklyChangeData.isPositive
        },
        weeklyStats: {
          ...weeklyStats,
        },
        monthlyStats: {
          ...monthlyStats,
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
