
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { loadTodayStats } from '@/utils/timerContextUtils';
import { toast } from 'sonner';

export function useTimerStatsLogic() {
  const { user } = useAuth();
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const currentDateRef = useRef<string>(new Date().toISOString().split('T')[0]);
  const [lastCheckTime, setLastCheckTime] = useState<number>(Date.now());

  // Function to refresh stats
  const refreshStats = async (forceMidnightReset = false) => {
    const newDate = new Date().toISOString().split('T')[0];
    console.log('Refreshing timer stats with current date:', newDate);
    
    if (forceMidnightReset || newDate !== currentDateRef.current) {
      console.log('Date changed from', currentDateRef.current, 'to', newDate, '- resetting stats');
      // Reset all stats on date change
      setCompletedSessions(0);
      setTotalTimeToday(0);
      setCurrentSessionIndex(0);
      
      // Show toast notification for date change
      if (forceMidnightReset || (currentDateRef.current && currentDateRef.current !== newDate)) {
        toast.info("It's a new day! Your daily stats have been reset.");
      }
    }
    
    // Always use the current date, not the stored one
    if (user) {
      // Get fresh stats from the database
      const stats = await loadTodayStats(user.id);
      
      // Only update if we got valid stats and they're for today's date
      if (stats && newDate === new Date().toISOString().split('T')[0]) {
        setCompletedSessions(stats.completedSessions);
        setTotalTimeToday(stats.totalTimeToday);
      }
      
      // Update the current date reference
      currentDateRef.current = newDate;
      setLastCheckTime(Date.now());
    } else {
      // Reset stats for non-authenticated users
      currentDateRef.current = newDate;
    }
  };

  // Load user's stats when logged in
  useEffect(() => {
    // Force refresh on initial load to ensure proper day
    refreshStats(true);
    
    // Set up a periodic refresh every 3 minutes to ensure data freshness
    const refreshIntervalId = setInterval(() => {
      refreshStats();
    }, 3 * 60 * 1000); // Every 3 minutes
    
    return () => clearInterval(refreshIntervalId);
  }, [user]);

  // Check for date change more frequently (every minute)
  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentDate = new Date().toISOString().split('T')[0];
      
      if (currentDate !== currentDateRef.current) {
        console.log('Date changed from', currentDateRef.current, 'to', currentDate, '- refreshing timer stats');
        refreshStats(true); // Force midnight reset
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [user]);

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
