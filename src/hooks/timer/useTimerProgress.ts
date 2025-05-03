
import { useMemo } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from '../useTimerSettings';

export function useTimerProgress(timerMode: TimerMode, timeRemaining: number, settings: TimerSettings) {
  // Calculate total time in seconds for the current mode
  const totalTime = useMemo(() => {
    if (!settings || typeof settings !== 'object') {
      console.error("Invalid settings object in useTimerProgress:", settings);
      return 0;
    }
    
    try {
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
    } catch (error) {
      console.error("Error calculating total time:", error);
      return 0;
    }
  }, [timerMode, settings]);

  // Calculate progress percentage (0-100)
  const progress = useMemo(() => {
    if (totalTime <= 0) return 0;
    return ((totalTime - timeRemaining) / totalTime) * 100;
  }, [timeRemaining, totalTime]);

  // Return total time calculation function for other hooks to use
  const getTotalTimeForMode = () => totalTime;

  return {
    progress,
    totalTime,
    getTotalTimeForMode
  };
}
