
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { loadTodayStats } from '@/utils/timerContextUtils';

export function useTimerStatsLogic() {
  const { user } = useAuth();
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);

  // Load user's stats when logged in
  useEffect(() => {
    if (user) {
      loadTodayStats(user.id).then(stats => {
        setCompletedSessions(stats.completedSessions);
        setTotalTimeToday(stats.totalTimeToday);
      });
    }
  }, [user]);

  return {
    completedSessions,
    setCompletedSessions,
    totalTimeToday,
    setTotalTimeToday,
    currentSessionIndex,
    setCurrentSessionIndex
  };
}
