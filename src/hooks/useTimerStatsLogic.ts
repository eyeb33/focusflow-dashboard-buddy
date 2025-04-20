
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
  const hasShownResetToastRef = useRef<boolean>(false);

  // Function to refresh stats
  const refreshStats = async (forceMidnightReset = false) => {
    const now = new Date();
    const newDate = now.toISOString().split('T')[0];
    console.log('Refreshing timer stats with current date:', newDate, 'force reset:', forceMidnightReset);
    
    // Check if date has changed or force reset is requested
    if (forceMidnightReset || newDate !== currentDateRef.current) {
      console.log('Date changed from', currentDateRef.current, 'to', newDate, '- resetting stats');
      
      // Reset all stats on date change
      setCompletedSessions(0);
      setTotalTimeToday(0);
      setCurrentSessionIndex(0);
      
      // Show toast notification for date change - only once per day
      if (currentDateRef.current && (forceMidnightReset || currentDateRef.current !== newDate) && !hasShownResetToastRef.current) {
        toast.info("It's a new day! Your daily stats have been reset.");
        hasShownResetToastRef.current = true;
        
        // Reset the toast flag after a delay to prevent multiple identical toasts
        setTimeout(() => {
          hasShownResetToastRef.current = false;
        }, 5000);
      }
      
      // Update the current date reference
      currentDateRef.current = newDate;
    }
    
    // If user is logged in, load their stats from database
    if (user) {
      try {
        // Get fresh stats from the database
        const stats = await loadTodayStats(user.id);
        
        // Only update if we got valid stats and they're for today's date
        if (stats && newDate === new Date().toISOString().split('T')[0]) {
          setCompletedSessions(stats.completedSessions);
          setTotalTimeToday(stats.totalTimeToday);
        }
      } catch (error) {
        console.error('Error loading today stats:', error);
      }
      
      setLastCheckTime(Date.now());
    }
  };

  // Load user's stats when logged in
  useEffect(() => {
    // Force refresh on initial load to ensure proper day
    refreshStats(true);
    
    // Set up a periodic refresh every minute to ensure data freshness
    const refreshIntervalId = setInterval(() => {
      refreshStats();
    }, 60 * 1000); // Every minute
    
    return () => clearInterval(refreshIntervalId);
  }, [user]);

  // Check for date change more frequently (every 15 seconds)
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      
      // Force midnight reset if date is different from stored date
      if (currentDate !== currentDateRef.current) {
        console.log('Date changed from', currentDateRef.current, 'to', currentDate, '- forcing reset');
        refreshStats(true); // Force midnight reset
      }
    };
    
    const intervalId = setInterval(checkMidnight, 15000); // Check every 15 seconds
    
    return () => clearInterval(intervalId);
  }, []);

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
