
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTotalMetrics } from "@/hooks/dashboard/stats/useTotalMetrics";

interface DailyStats {
  focusSessions: number;
  focusMinutes: number;
  yesterdayFocusSessions: number | null;
  yesterdayFocusMinutes: number | null;
}

export function useSessionStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DailyStats>({
    focusSessions: 0,
    focusMinutes: 0,
    yesterdayFocusSessions: null,
    yesterdayFocusMinutes: null
  });
  const [isLoading, setIsLoading] = useState(true);

  const currentDateRef = useRef<string>(new Date().toISOString().split('T')[0]);
  const hasResetTodayRef = useRef<boolean>(false);

  const fetchTodayStats = async (forceMidnightReset = false) => {
    if (!user) {
      setIsLoading(false);
      setStats({
        focusSessions: 0,
        focusMinutes: 0,
        yesterdayFocusSessions: null,
        yesterdayFocusMinutes: null
      });
      return;
    }
    try {
      setIsLoading(true);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const todayDateString = today.toISOString().split('T')[0];
      const yesterdayDateString = yesterday.toISOString().split('T')[0];

      // Check for date change
      if (forceMidnightReset || todayDateString !== currentDateRef.current) {
        if (!hasResetTodayRef.current) {
          setStats({
            focusSessions: 0,
            focusMinutes: 0,
            yesterdayFocusSessions: null,
            yesterdayFocusMinutes: null
          });
          hasResetTodayRef.current = true;
        }
      }
      currentDateRef.current = todayDateString;

      const todayMetrics = await fetchTotalMetrics(user.id, todayDateString);
      const yesterdayMetrics = await fetchTotalMetrics(user.id, yesterdayDateString);

      setStats({
        focusSessions: todayMetrics.totalSessions || 0,
        focusMinutes: todayMetrics.totalMinutes || 0,
        yesterdayFocusSessions: yesterdayMetrics.totalSessions || null,
        yesterdayFocusMinutes: yesterdayMetrics.totalMinutes || null
      });
    } catch (error) {
      console.error('Error in stats fetch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset hasResetToday flag at regular intervals
  useEffect(() => {
    const resetIntervalId = setInterval(() => {
      hasResetTodayRef.current = false;
    }, 5 * 60 * 1000);
    return () => clearInterval(resetIntervalId);
  }, []);

  useEffect(() => {
    fetchTodayStats(true);
    const intervalId = setInterval(() => {
      fetchTodayStats();
    }, 3 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [user]);

  useEffect(() => {
    if (user) {
      const channel = supabase
        .channel('sessions-summary-changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sessions_summary',
            filter: `user_id=eq.${user.id}`
          },
          () => { fetchTodayStats(); }
        )
        .subscribe();

      const sessionChannel = supabase
        .channel('focus-sessions-changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'focus_sessions',
            filter: `user_id=eq.${user.id}`
          },
          () => { fetchTodayStats(); }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(sessionChannel);
      };
    }
  }, [user]);

  useEffect(() => {
    const dateCheckIntervalId = setInterval(() => {
      const currentDate = new Date().toISOString().split('T')[0];
      if (currentDate !== currentDateRef.current) {
        fetchTodayStats(true);
      }
    }, 60000);
    return () => clearInterval(dateCheckIntervalId);
  }, [user]);

  return { stats, isLoading };
}
