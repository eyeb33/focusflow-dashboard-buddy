
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from '../useTimerSettings';

export function useTimerProgress(
  timerMode: TimerMode, 
  timeRemaining: number, 
  settings: TimerSettings
) {
  // Calculate total time for current timer mode
  const getTotalTimeForMode = useCallback((): number => {
    switch (timerMode) {
      case 'work':
        return settings.workDuration * 60;
      case 'break':
        return settings.breakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
      default:
        return settings.workDuration * 60;
    }
  }, [timerMode, settings]);
  
  // Calculate progress (0 to 100)
  const totalTime = getTotalTimeForMode();
  const elapsedTime = totalTime - timeRemaining;
  const progress = totalTime > 0 ? Math.max(0, Math.min(1, elapsedTime / totalTime)) * 100 : 0;

  return {
    progress,
    totalTime,
    getTotalTimeForMode
  };
}
