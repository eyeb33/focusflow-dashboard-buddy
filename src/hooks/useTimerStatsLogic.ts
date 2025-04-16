
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { loadTodayStats } from '@/utils/timerContextUtils';

export function useTimerStatsLogic() {
  const { user } = useAuth();
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const currentDateRef = useRef<string>(new Date().toISOString().split('T')[0]);
  const [lastCheckTime, setLastCheckTime] = useState<number>(Date.now());

  // Function to refresh stats
  const refreshStats = async () => {
    console.log('Refreshing timer stats with current date:', new Date().toISOString().split('T')[0]);
    if (user) {
      // Get fresh stats from the database
      const stats = await loadTodayStats(user.id);
      setCompletedSessions(stats.completedSessions);
      setTotalTimeToday(stats.totalTimeToday);
      // Update the current date reference
      currentDateRef.current = new Date().toISOString().split('T')[0];
      setLastCheckTime(Date.now());
    } else {
      // Reset stats for non-authenticated users
      setCompletedSessions(0);
      setTotalTimeToday(0);
    }
  };

  // Load user's stats when logged in
  useEffect(() => {
    refreshStats();
  }, [user]);

  // Check for date change periodically (every minute)
  useEffect(() => {
    // Check for date changes every minute
    const intervalId = setInterval(() => {
      const currentDate = new Date().toISOString().split('T')[0];
      if (currentDate !== currentDateRef.current) {
        console.log('Date changed from', currentDateRef.current, 'to', currentDate, '- refreshing timer stats');
        refreshStats();
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [user]);

  // Force refresh every hour to ensure data freshness
  useEffect(() => {
    const hourlyRefreshInterval = setInterval(() => {
      // Refresh if last check was more than 30 minutes ago
      if (Date.now() - lastCheckTime > 30 * 60 * 1000) {
        console.log('Periodic refresh of timer stats');
        refreshStats();
      }
    }, 30 * 60 * 1000); // Check every 30 minutes

    return () => clearInterval(hourlyRefreshInterval);
  }, [lastCheckTime, user]);

  return {
    completedSessions,
    setCompletedSessions,
    totalTimeToday,
    setTotalTimeToday,
    currentSessionIndex,
    setCurrentSessionIndex,
    refreshStats
  };
}
