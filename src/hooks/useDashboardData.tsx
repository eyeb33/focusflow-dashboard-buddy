import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type DashboardData = {
  stats: {
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
  };
  productivityTrend: {
    date: string;
    productivity: number;
  }[];
  streakData: {
    date: string;
    completed: number;
  }[];
  insights: {
    title: string;
    content: string;
  }[];
  dailyProductivity: {
    name: string;
    sessions: number;
    minutes: number;
  }[];
  weeklyProductivity: {
    name: string;
    sessions: number;
    minutes: number;
  }[];
  monthlyProductivity: {
    name: string;
    sessions: number;
    minutes: number;
  }[];
};

export const useDashboardData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: {
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
    productivityTrend: [],
    streakData: [],
    insights: [],
    dailyProductivity: [],
    weeklyProductivity: [],
    monthlyProductivity: []
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      subscribeToRealTimeUpdates();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Get current date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch total stats
      await fetchTotalStats();
      
      // Fetch productivity trends
      await fetchProductivityTrends();
      
      // Fetch streak data
      await fetchStreakData();
      
      // Fetch insights
      await fetchInsights();
      
      // Fetch daily productivity data
      await fetchDailyProductivity();
      
      // Fetch weekly productivity data
      await fetchWeeklyProductivity();
      
      // Fetch monthly productivity data
      await fetchMonthlyProductivity();
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error.message);
      toast({
        title: "Error loading dashboard data",
        description: "There was a problem fetching your productivity data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTotalStats = async () => {
    try {
      // Fetch completed sessions count
      const { data: sessionCount, error: sessionError } = await supabase
        .from('focus_sessions')
        .select('count')
        .eq('user_id', user?.id)
        .eq('completed', true);

      // Fetch total focus time
      const { data: focusTimeData, error: timeError } = await supabase
        .from('focus_sessions')
        .select('duration, session_type')
        .eq('user_id', user?.id)
        .eq('completed', true);

      if (sessionError || timeError) throw sessionError || timeError;

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate weekly change data
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];
      
      // Get current week's sessions
      const { data: currentWeekSessions, error: currentWeekError } = await supabase
        .from('focus_sessions')
        .select('duration, created_at')
        .eq('user_id', user?.id)
        .eq('completed', true)
        .eq('session_type', 'work')
        .gte('created_at', oneWeekAgoStr);
        
      // Get previous week's sessions
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];
      
      const { data: prevWeekSessions, error: prevWeekError } = await supabase
        .from('focus_sessions')
        .select('duration, created_at')
        .eq('user_id', user?.id)
        .eq('completed', true)
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

      // Get current streak and daily average
      const { data: summaryData, error: summaryError } = await supabase
        .from('sessions_summary')
        .select('longest_streak, total_sessions, total_focus_time, date')
        .eq('user_id', user?.id)
        .order('date', { ascending: false })
        .limit(30);

      if (summaryError) throw summaryError;

      // Calculate total focus minutes (only from work sessions)
      const totalMinutes = focusTimeData?.reduce((acc: number, session: any) => 
        acc + (session.session_type === 'work' ? Math.floor(session.duration / 60) : 0), 0) || 0;
      
      const totalSessions = sessionCount?.[0]?.count || 0;
      
      // Calculate current streak
      let currentStreak = 0;
      if (summaryData && summaryData.length > 0) {
        // Check if there's an entry for today
        const hasEntryToday = summaryData.some(day => day.date === today);
        
        if (hasEntryToday) {
          currentStreak = 1; // Start with today
          
          // Find consecutive days going back
          const sortedDates = [...summaryData].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          
          let lastDate = new Date(today);
          
          for (let i = 0; i < sortedDates.length; i++) {
            const currentDate = new Date(sortedDates[i].date);
            if (currentDate.getTime() === lastDate.getTime()) continue; // Skip today's date
            
            // Check if this date is one day before the last checked date
            const diffTime = lastDate.getTime() - currentDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
              currentStreak++;
              lastDate = currentDate;
            } else {
              break; // Break the streak if days are not consecutive
            }
          }
        }
      }
      
      // Find best streak (maximum longest_streak value)
      const bestStreakValue = summaryData?.reduce((max: number, day: any) => 
        Math.max(max, day.longest_streak || 0), 0) || 0;
      
      // Calculate daily average from the last 30 days of data
      const daysWithData = summaryData?.length || 1;
      const totalSessionsInPeriod = summaryData?.reduce((acc: number, day: any) => 
        acc + day.total_sessions, 0) || 0;
      const dailyAverage = Math.round((totalSessionsInPeriod / daysWithData) * 10) / 10;

      setDashboardData(prev => ({
        ...prev,
        stats: {
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
        }
      }));
    } catch (error: any) {
      console.error('Error fetching stats:', error.message);
    }
  };

  const fetchProductivityTrends = async () => {
    try {
      const { data, error } = await supabase
        .from('productivity_trends')
        .select('date, productivity_score')
        .eq('user_id', user?.id)
        .order('date', { ascending: true })
        .limit(30);

      if (error) throw error;

      const formattedData = data?.map(item => ({
        date: item.date,
        productivity: item.productivity_score
      })) || [];

      setDashboardData(prev => ({
        ...prev,
        productivityTrend: formattedData
      }));
    } catch (error: any) {
      console.error('Error fetching productivity trends:', error.message);
    }
  };

  const fetchStreakData = async () => {
    try {
      // First, get actual focus sessions by day
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('created_at, duration, completed')
        .eq('user_id', user?.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('session_type', 'work');

      if (error) throw error;

      // Process sessions into days with completion counts
      const sessionsByDay: Record<string, number> = {};
      
      data?.forEach(session => {
        const date = new Date(session.created_at).toISOString().split('T')[0];
        if (session.completed) {
          sessionsByDay[date] = (sessionsByDay[date] || 0) + 1;
        }
      });

      // Generate last 28 days, filling in zeros for days with no data
      const streakData = [];
      for (let i = 28; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        streakData.push({
          date: dateStr,
          completed: sessionsByDay[dateStr] || 0
        });
      }

      setDashboardData(prev => ({
        ...prev,
        streakData
      }));
    } catch (error: any) {
      console.error('Error fetching streak data:', error.message);
    }
  };

  const fetchInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('insights')
        .select('title, content')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // If no personal insights yet, generate some default ones
      const insights = data?.length ? data : [
        {
          title: 'Focus Tip',
          content: 'Try the Pomodoro technique: 25 minutes of focused work followed by a 5-minute break.'
        },
        {
          title: 'Productivity Insight',
          content: 'Research shows that taking regular breaks improves overall productivity and creativity.'
        },
        {
          title: 'Getting Started',
          content: 'Set small, achievable goals when you begin working to build momentum.'
        }
      ];

      setDashboardData(prev => ({
        ...prev,
        insights
      }));
    } catch (error: any) {
      console.error('Error fetching insights:', error.message);
    }
  };

  const fetchDailyProductivity = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('created_at, duration, completed')
        .eq('user_id', user?.id)
        .gte('created_at', startOfDay.toISOString())
        .eq('session_type', 'work');

      if (error) throw error;

      // Group sessions by hour
      const hourlyData: Record<number, {sessions: number, minutes: number}> = {};
      
      for (let i = 0; i < 24; i++) {
        hourlyData[i] = { sessions: 0, minutes: 0 };
      }

      data?.forEach(session => {
        const hour = new Date(session.created_at).getHours();
        if (session.completed) {
          hourlyData[hour].sessions += 1;
          hourlyData[hour].minutes += Math.floor(session.duration / 60);
        }
      });

      // Format data for chart
      const dailyProductivity = Object.entries(hourlyData)
        .map(([hour, data]) => ({
          name: `${hour}:00`,
          sessions: data.sessions,
          minutes: data.minutes
        }));

      setDashboardData(prev => ({
        ...prev,
        dailyProductivity
      }));
    } catch (error: any) {
      console.error('Error fetching daily productivity:', error.message);
    }
  };

  const fetchWeeklyProductivity = async () => {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('created_at, duration, completed')
        .eq('user_id', user?.id)
        .gte('created_at', startOfWeek.toISOString())
        .eq('session_type', 'work');

      if (error) throw error;

      // Group sessions by day of week
      const dailyData: Record<number, {sessions: number, minutes: number}> = {};
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      for (let i = 0; i < 7; i++) {
        dailyData[i] = { sessions: 0, minutes: 0 };
      }

      data?.forEach(session => {
        const dayOfWeek = new Date(session.created_at).getDay();
        if (session.completed) {
          dailyData[dayOfWeek].sessions += 1;
          dailyData[dayOfWeek].minutes += Math.floor(session.duration / 60);
        }
      });

      // Format data for chart
      const weeklyProductivity = Object.entries(dailyData)
        .map(([day, data]) => ({
          name: dayNames[parseInt(day)],
          sessions: data.sessions,
          minutes: data.minutes
        }));

      setDashboardData(prev => ({
        ...prev,
        weeklyProductivity
      }));
    } catch (error: any) {
      console.error('Error fetching weekly productivity:', error.message);
    }
  };

  const fetchMonthlyProductivity = async () => {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('created_at, duration, completed')
        .eq('user_id', user?.id)
        .gte('created_at', startOfMonth.toISOString())
        .eq('session_type', 'work');

      if (error) throw error;

      // Group sessions by day of month
      const dailyData: Record<number, {sessions: number, minutes: number}> = {};
      
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        dailyData[i] = { sessions: 0, minutes: 0 };
      }

      data?.forEach(session => {
        const dayOfMonth = new Date(session.created_at).getDate();
        if (session.completed) {
          dailyData[dayOfMonth].sessions += 1;
          dailyData[dayOfMonth].minutes += Math.floor(session.duration / 60);
        }
      });

      // Format data for chart
      const monthlyProductivity = Object.entries(dailyData)
        .map(([day, data]) => ({
          name: `${day}`,
          sessions: data.sessions,
          minutes: data.minutes
        }));

      setDashboardData(prev => ({
        ...prev,
        monthlyProductivity
      }));
    } catch (error: any) {
      console.error('Error fetching monthly productivity:', error.message);
    }
  };

  const subscribeToRealTimeUpdates = () => {
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'focus_sessions', filter: `user_id=eq.${user?.id}` },
        (payload) => {
          console.log('Focus session change received:', payload);
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions_summary', filter: `user_id=eq.${user?.id}` },
        (payload) => {
          console.log('Summary change received:', payload);
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'productivity_trends', filter: `user_id=eq.${user?.id}` },
        (payload) => {
          console.log('Trend change received:', payload);
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'insights', filter: `user_id=eq.${user?.id}` },
        (payload) => {
          console.log('Insight change received:', payload);
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return { dashboardData, isLoading, refreshData: fetchDashboardData };
};
