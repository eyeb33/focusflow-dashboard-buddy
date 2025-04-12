
import { useState } from 'react';
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
  const [stats, setStats] = useState<StatsData>({
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
  });

  const fetchTotalStats = async () => {
    try {
      if (!userId) {
        console.error('No user ID available for fetching stats');
        return;
      }
      
      console.log('Fetching total stats for user:', userId);
      
      // First check the sessions_summary table for today's data
      const today = new Date().toISOString().split('T')[0];
      
      const { data: todaySummary, error: todaySummaryError } = await supabase
        .from('sessions_summary')
        .select('total_completed_sessions, total_focus_time')
        .eq('user_id', userId)
        .eq('date', today)
        .single();
        
      console.log('Today summary data:', todaySummary, todaySummaryError);
      
      // Fetch completed sessions count
      const { data: sessionCount, error: sessionError } = await supabase
        .from('focus_sessions')
        .select('count')
        .eq('user_id', userId)
        .eq('completed', true)
        .eq('session_type', 'work');

      // Fetch total focus time
      const { data: focusTimeData, error: timeError } = await supabase
        .from('focus_sessions')
        .select('duration, session_type')
        .eq('user_id', userId)
        .eq('session_type', 'work');

      if (sessionError || timeError) throw sessionError || timeError;
      
      console.log('Focus time data count:', focusTimeData?.length);

      // Calculate weekly change data
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];
      
      // Get current week's sessions
      const { data: currentWeekSessions, error: currentWeekError } = await supabase
        .from('focus_sessions')
        .select('duration, created_at')
        .eq('user_id', userId)
        .eq('session_type', 'work')
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
      }
      
      // Calculate minutes change percentage
      let minutesChangePercent = 0;
      if (prevWeekMinutes > 0) {
        minutesChangePercent = Math.round(((currentWeekMinutes - prevWeekMinutes) / prevWeekMinutes) * 100);
      }
      
      // Calculate avg sessions per day
      const currentWeekAvg = currentWeekSessionCount / 7;
      const prevWeekAvg = prevWeekSessionCount / 7;
      
      let avgChangePercent = 0;
      if (prevWeekAvg > 0) {
        avgChangePercent = Math.round(((currentWeekAvg - prevWeekAvg) / prevWeekAvg) * 100);
      }

      // Get current streak and best streak
      const { data: summaryData, error: summaryError } = await supabase
        .from('sessions_summary')
        .select('longest_streak, total_sessions, total_focus_time, date, total_completed_sessions')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30);

      if (summaryError) throw summaryError;
      
      console.log('Summary data for calculating stats:', summaryData);

      // Calculate total focus minutes (only from work sessions)
      const totalMinutesFromSessions = focusTimeData?.reduce((acc: number, session: any) => 
        acc + (session.session_type === 'work' ? Math.floor(session.duration / 60) : 0), 0) || 0;
        
      // If we have today's summary, use that value for total minutes
      const totalMinutes = todaySummary ? todaySummary.total_focus_time : totalMinutesFromSessions;
      
      console.log('Total minutes calculation:', {
        fromSummary: todaySummary?.total_focus_time || 0,
        fromSessions: totalMinutesFromSessions,
        final: totalMinutes
      });
      
      const totalSessions = sessionCount?.[0]?.count || 0;
      
      // Calculate current streak
      let currentStreak = 0;
      if (summaryData && summaryData.length > 0) {
        // Check if there's data for recent days
        const hasEntryToday = summaryData.some(day => day.date === today);
        
        // Calculate streak based on recent days data
        const recentDays = summaryData.map(day => ({
          date: day.date,
          sessions: day.total_completed_sessions
        }));
        
        currentStreak = calculateStreak(recentDays, today);
      }
      
      // Find best streak (maximum longest_streak value)
      const bestStreakValue = summaryData?.reduce((max: number, day: any) => 
        Math.max(max, day.longest_streak || 0), 0) || 0;
      
      // Calculate daily average from the summary data
      // First, include today's sessions if available
      let todayCompletedSessions = 0;
      if (todaySummary) {
        todayCompletedSessions = todaySummary.total_completed_sessions || 0;
      } else {
        // If no summary for today, count today's completed sessions from focus_sessions table
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        
        const { data: todaySessions, error: todaySessionsError } = await supabase
          .from('focus_sessions')
          .select('*')
          .eq('user_id', userId)
          .eq('session_type', 'work')
          .eq('completed', true)
          .gte('created_at', startOfDay.toISOString());
          
        if (!todaySessionsError) {
          todayCompletedSessions = todaySessions?.length || 0;
          console.log('Today completed sessions from focus_sessions:', todayCompletedSessions);
        }
      }
      
      // Calculate daily average including today's sessions
      const totalDaysWithActivity = (summaryData && summaryData.length > 0) ? summaryData.length : 1;
      const totalCompletedSessions = summaryData?.reduce((acc: number, day: any) => 
        acc + (day.total_completed_sessions || 0), 0) || 0;
      
      console.log('Daily average calculation:', {
        totalCompletedSessions,
        totalDaysWithActivity,
        todayCompletedSessions
      });
      
      // Ensure we don't double-count today's sessions if it's already in the summary data
      const hasEntryToday = summaryData && summaryData.some(day => day.date === today);
      const adjustedTotalSessions = hasEntryToday ? 
        totalCompletedSessions : 
        totalCompletedSessions + todayCompletedSessions;
        
      const dailyAverage = Math.round((adjustedTotalSessions / totalDaysWithActivity) * 10) / 10;
      
      console.log('Calculated daily average:', dailyAverage);

      setStats({
        totalSessions: totalSessions,
        totalMinutes: totalMinutes,
        dailyAverage: dailyAverage,
        currentStreak: Math.max(1, currentStreak), // Ensure streak is at least 1 if we have data for today
        bestStreak: Math.max(bestStreakValue, currentStreak), // Update best streak if current is higher
        weeklyChange: {
          sessions: sessionChangePercent,
          minutes: minutesChangePercent,
          dailyAvg: avgChangePercent,
          isPositive: sessionChangePercent >= 0
        }
      });
      return {
        totalSessions,
        totalMinutes,
        dailyAverage,
        currentStreak: Math.max(1, currentStreak),
        bestStreak: Math.max(bestStreakValue, currentStreak),
        weeklyChange: {
          sessions: sessionChangePercent,
          minutes: minutesChangePercent,
          dailyAvg: avgChangePercent,
          isPositive: sessionChangePercent >= 0
        }
      };
    } catch (error: any) {
      console.error('Error fetching stats:', error.message);
      return null;
    }
  };

  return { stats, fetchTotalStats };
};
