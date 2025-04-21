
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
  const hasShownResetToastRef = useRef<boolean>(false);
  const documentHiddenTime = useRef<number | null>(null);

  // Function to refresh stats
  const refreshStats = async (forceMidnightReset = false) => {
    const now = new Date();
    const newDate = now.toISOString().split('T')[0];
    
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
        }, 3600000); // Reset after an hour instead of 5 seconds
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
    }
  };

  // Load user's stats when logged in
  useEffect(() => {
    // Force refresh on initial load to ensure proper day
    refreshStats(true);
    
    // Set up a periodic refresh every minute to ensure data freshness
    const refreshIntervalId = setInterval(() => {
      // Only refresh if document is visible
      if (!document.hidden) {
        refreshStats();
      }
    }, 60 * 1000); // Every minute
    
    return () => clearInterval(refreshIntervalId);
  }, [user]);

  // Track visibility changes to prevent unnecessary refreshes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Store the time when the document became hidden
        documentHiddenTime.current = Date.now();
      } else {
        // Check if we've been away long enough to justify a refresh (more than 30 seconds)
        if (documentHiddenTime.current && (Date.now() - documentHiddenTime.current > 30000)) {
          refreshStats();
        }
        documentHiddenTime.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Check for date change less frequently (once per minute)
  useEffect(() => {
    const checkMidnight = () => {
      if (!document.hidden) {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        
        // Force midnight reset if date is different from stored date
        if (currentDate !== currentDateRef.current) {
          console.log('Date changed from', currentDateRef.current, 'to', currentDate, '- forcing reset');
          refreshStats(true); // Force midnight reset
        }
      }
    };
    
    const intervalId = setInterval(checkMidnight, 60000); // Check every minute
    
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
