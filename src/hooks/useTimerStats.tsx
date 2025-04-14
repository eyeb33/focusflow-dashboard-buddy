
import React from 'react';
import { useTimer } from '@/contexts/TimerContext';

export const useTimerStats = () => {
  const timer = useTimer();
  
  // Extract only the stats
  const {
    completedSessions,
    totalTimeToday,
    settings,
    currentSessionIndex
  } = timer;
  
  return {
    completedSessions,
    totalTimeToday,
    currentSessionIndex,
    sessionsUntilLongBreak: settings.sessionsUntilLongBreak,
    completedRounds: Math.floor(completedSessions / settings.sessionsUntilLongBreak)
  };
};
