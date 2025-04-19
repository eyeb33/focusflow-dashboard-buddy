
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

  const fetchWeeklyStats = async (userId: string): Promise<WeeklyMonthlyStats> => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString();
  
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('duration')
      .eq('user_id', userId)
      .eq('session_type', 'work')
      .eq('completed', true)
      .gte('created_at', oneWeekAgoStr);
    
    if (error) {
      console.error('Error fetching weekly stats:', error);
      return { totalSessions: 0, totalMinutes: 0 };
    }
    
    const totalSessions = data.length;
    const totalMinutes = data.reduce((acc, session) => acc + Math.floor(session.duration / 60), 0);
    
    return {
      totalSessions,
      totalMinutes,
      dailyAverage: totalSessions > 0 ? Math.round(totalSessions / 7 * 10) / 10 : 0
    };
  };
  
  const fetchMonthlyStats = async (userId: string): Promise<WeeklyMonthlyStats> => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneMonthAgoStr = oneMonthAgo.toISOString();
  
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('duration')
      .eq('user_id', userId)
      .eq('session_type', 'work')
      .eq('completed', true)
      .gte('created_at', oneMonthAgoStr);
    
    if (error) {
      console.error('Error fetching monthly stats:', error);
      return { totalSessions: 0, totalMinutes: 0 };
    }
    
    const totalSessions = data.length;
    const totalMinutes = data.reduce((acc, session) => acc + Math.floor(session.duration / 60), 0);
    
    return {
      totalSessions,
      totalMinutes,
      dailyAverage: totalSessions > 0 ? Math.round(totalSessions / 30 * 10) / 10 : 0
    };
  };

  const fetchTotalStats = async (): Promise<StatsData | null> => {
    try {
      if (!userId) {
        console.error('No user ID available for fetching stats');
        return null;
      }
      
      console.log('Fetching total stats for user:', userId);
      
      const today = new Date().toISOString().split('T')[0];
      currentDateRef.current = today;
      
      // Fetch all data concurrently for better performance
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
        },
        weeklyStats,
        monthlyStats
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
    staleTime: 5 * 60 * 1000, // 5 minutes before considering data stale
  });

  // Check for date changes periodically and force refetch
  useEffect(() => {
    if (!userId) return;

    // Check for date changes every minute
    const intervalId = setInterval(() => {
      const currentDate = new Date().toISOString().split('T')[0];
      if (currentDate !== currentDateRef.current) {
        console.log('Date changed from', currentDateRef.current, 'to', currentDate, '- invalidating and refetching dashboard stats');
        currentDateRef.current = currentDate;
        result.refetch();
      }
    }, 60000); // Check every minute

    // Also add a periodic refetch every hour to ensure data freshness
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
