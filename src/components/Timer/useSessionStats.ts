
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
  const documentHiddenTime = useRef<number | null>(null);

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
        setStats({
          focusSessions: 0,
          focusMinutes: 0,
          yesterdayFocusSessions: null,
          yesterdayFocusMinutes: null
        });
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

  // Initial fetch and periodic updates
  useEffect(() => {
    fetchTodayStats(true);
    
    const intervalId = setInterval(() => {
      // Only refresh if document is visible
      if (!document.hidden) {
        fetchTodayStats();
      }
    }, 3 * 60 * 1000); // Every 3 minutes
    
    return () => clearInterval(intervalId);
  }, [user]);

  // Track visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Store the time when the document became hidden
        documentHiddenTime.current = Date.now();
      } else {
        // Only refresh if hidden for more than 30 seconds
        if (documentHiddenTime.current && (Date.now() - documentHiddenTime.current > 30000)) {
          fetchTodayStats();
        }
        documentHiddenTime.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Listen to real-time database changes
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

  // Less frequent date check
  useEffect(() => {
    const dateCheckIntervalId = setInterval(() => {
      if (!document.hidden) {
        const currentDate = new Date().toISOString().split('T')[0];
        if (currentDate !== currentDateRef.current) {
          fetchTodayStats(true);
        }
      }
    }, 60000); // Every minute
    
    return () => clearInterval(dateCheckIntervalId);
  }, [user]);

  return { stats, isLoading };
}
