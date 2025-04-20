
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

  // Provide sessionsUntilLongBreak directly (can customize per user later)
  return {
    completedSessions,
    totalTimeToday,
    currentSessionIndex,
    sessionsUntilLongBreak: settings?.sessionsUntilLongBreak ?? 4,
    completedRounds: Math.floor(completedSessions / (settings?.sessionsUntilLongBreak ?? 4))
  };
};
