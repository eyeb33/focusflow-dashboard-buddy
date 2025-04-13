
import { useTimer } from '@/contexts/TimerContext';

export const useTimerStats = () => {
  const timer = useTimer();
  
  // Extract only the stats
  const {
    completedSessions,
    totalTimeToday,
    settings
  } = timer;
  
  // Calculate completed rounds (full cycles)
  const completedRounds = Math.floor(completedSessions / settings.sessionsUntilLongBreak);
  
  // Current position in the cycle
  const currentCyclePosition = completedSessions % settings.sessionsUntilLongBreak;
  
  return {
    completedSessions,
    totalTimeToday,
    sessionsUntilLongBreak: settings.sessionsUntilLongBreak,
    completedRounds,
    currentCyclePosition
  };
};
