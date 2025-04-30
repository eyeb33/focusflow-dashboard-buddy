
import { useTimerContext } from '@/contexts/TimerContext';
import { useTimerSettings } from "./useTimerSettings";

export function useTimerStats() {
  const timer = useTimerContext();
  const { settings } = useTimerSettings();

  // Access completedSessions directly from the timer context
  const completedSessions = timer.completedSessions || 0;
  
  // Use sessionsUntilLongBreak instead of sessionsBeforeLongBreak
  const sessionsUntilLongBreak = settings.sessionsUntilLongBreak;

  return {
    completedSessions,
    sessionsUntilLongBreak,
  };
}
