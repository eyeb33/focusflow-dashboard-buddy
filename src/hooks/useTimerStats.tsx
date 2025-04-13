
import React from 'react';
import { useTimer } from '@/contexts/TimerContext';

export const useTimerStats = () => {
  const timer = useTimer();
  
  // Extract only the stats
  const {
    completedSessions,
    totalTimeToday,
    settings
  } = timer;
  
  return {
    completedSessions,
    totalTimeToday,
    sessionsUntilLongBreak: settings.sessionsUntilLongBreak,
    completedRounds: Math.floor(completedSessions / settings.sessionsUntilLongBreak)
  };
};
