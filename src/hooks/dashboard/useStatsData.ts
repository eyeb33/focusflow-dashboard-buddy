
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateStreak } from '@/utils/streak/calculateStreak';

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

export const useStatsData = (userId: string | undefined) => {
  const fetchTotalStats = async (): Promise<StatsData | null> => {
    try {
      if (!userId) {
        console.error('No user ID available for fetching stats');
        return null;
      }
      
      console.log('Fetching total stats for user:', userId);
      
      // First check the sessions_summary table for total data and streak info
      const today = new Date().toISOString().split('T')[0];
      
      const { data: summaryData, error: summaryError } = await supabase
        .from('sessions_summary')
        .select('longest_streak, total_sessions, total_focus_time, date, total_completed_sessions')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30);
        
      if (summaryError) {
        console.error('Error fetching summary data:', summaryError);
        throw summaryError;
      }
      
      console.log('Summary data for calculating stats:', summaryData);
      
      // Calculate current streak based on consecutive days with activity
      const recentDays = summaryData?.map(day => ({
        date: day.date,
        sessions: day.total_completed_sessions
      })) || [];
      
      const currentStreak = calculateStreak(recentDays, today);
      console.log('Current streak:', currentStreak);
      
      // Find best streak (maximum longest_streak value)
      const bestStreakValue = summaryData?.reduce((max: number, day: any) => 
        Math.max(max, day.longest_streak || 0), currentStreak) || currentStreak;
      console.log('Best streak:', bestStreakValue);
      
      // Calculate daily average from days with activity (not total days in range)
      const activeDaysCount = summaryData?.filter(day => day.total_completed_sessions > 0).length || 1;
      const totalCompletedSessions = summaryData?.reduce((acc, day) => 
        acc + (day.total_completed_sessions || 0), 0) || 0;
      const totalFocusMinutes = summaryData?.reduce((acc, day) => 
        acc + (day.total_focus_time || 0), 0) || 0;
      const totalSessions = summaryData?.reduce((acc, day) => 
        acc + (day.total_sessions || 0), 0) || 0;
      
      // Calculate daily average based only on days with activity
      const dailyAverage = activeDaysCount > 0 
        ? Math.round((totalCompletedSessions / activeDaysCount) * 10) / 10 
        : 0;
      
      console.log('Daily average calculation:', {
        activeDaysCount,
        totalCompletedSessions,
        dailyAverage
      });
      
      // Calculate weekly change data for trends
      const weeklyChanges = await calculateWeeklyChanges(userId);
      
      return {
        totalSessions,
        totalMinutes: totalFocusMinutes,
        dailyAverage,
        currentStreak,
        bestStreak: bestStreakValue,
        weeklyChange: weeklyChanges
      };
    } catch (error: any) {
      console.error('Error fetching stats:', error.message);
      return null;
    }
  };
  
  // Helper function to calculate weekly changes
  const calculateWeeklyChanges = async (userId: string) => {
    // Get current week's sessions
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];
    
    const { data: currentWeekSessions, error: currentWeekError } = await supabase
      .from('focus_sessions')
      .select('duration, created_at')
      .eq('user_id', userId)
      .eq('session_type', 'work')
      .eq('completed', true)
      .gte('created_at', oneWeekAgoStr);
      
    // Get previous week's sessions
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];
    
    const { data: prevWeekSessions, error: prevWeekError } = await supabase
      .from('focus_sessions')
      .select('duration, created_at')
      .eq('user_id', userId)
      .eq('session_type', 'work')
      .eq('completed', true)
      .gte('created_at', twoWeeksAgoStr)
      .lt('created_at', oneWeekAgoStr);
      
    if (currentWeekError || prevWeekError) {
      console.error('Error fetching weekly comparison data');
    }
    
    // Calculate weekly changes
    const currentWeekSessionCount = currentWeekSessions?.length || 0;
    const prevWeekSessionCount = prevWeekSessions?.length || 0;
    
    const currentWeekMinutes = currentWeekSessions?.reduce((acc: number, session: any) => 
      acc + Math.floor(session.duration / 60), 0) || 0;
      
    const prevWeekMinutes = prevWeekSessions?.reduce((acc: number, session: any) => 
      acc + Math.floor(session.duration / 60), 0) || 0;
      
    // Calculate session change percentage
    let sessionChangePercent = 0;
    if (prevWeekSessionCount > 0) {
      sessionChangePercent = Math.round(((currentWeekSessionCount - prevWeekSessionCount) / prevWeekSessionCount) * 100);
    } else if (currentWeekSessionCount > 0) {
      sessionChangePercent = 100; // If there were no sessions last week but there are this week
    }
    
    // Calculate minutes change percentage
    let minutesChangePercent = 0;
    if (prevWeekMinutes > 0) {
      minutesChangePercent = Math.round(((currentWeekMinutes - prevWeekMinutes) / prevWeekMinutes) * 100);
    } else if (currentWeekMinutes > 0) {
      minutesChangePercent = 100; // If there were no minutes last week but there are this week
    }
    
    // Calculate avg sessions per day
    const currentWeekAvg = currentWeekSessionCount / 7;
    const prevWeekAvg = prevWeekSessionCount / 7;
    
    let avgChangePercent = 0;
    if (prevWeekAvg > 0) {
      avgChangePercent = Math.round(((currentWeekAvg - prevWeekAvg) / prevWeekAvg) * 100);
    } else if (currentWeekAvg > 0) {
      avgChangePercent = 100; // If there was no average last week but there is this week
    }
    
    return {
      sessions: sessionChangePercent,
      minutes: minutesChangePercent,
      dailyAvg: avgChangePercent,
      isPositive: sessionChangePercent >= 0
    };
  };

  const result = useQuery({
    queryKey: ['stats', userId],
    queryFn: fetchTotalStats,
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute before considering data stale (reduced from 5 min)
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
