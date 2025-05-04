
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
    
    // Calculate what percentage of the timer has elapsed
    const progressPercentage = ((totalTime - timeRemaining) / totalTime) * 100;
    
    // Debug log for checking all timer modes
    console.log(`Progress calculation for ${timerMode}: totalTime=${totalTime}, timeRemaining=${timeRemaining}, progress=${progressPercentage.toFixed(2)}%, settings=${JSON.stringify({
      workDuration: settings.workDuration,
      breakDuration: settings.breakDuration,
      longBreakDuration: settings.longBreakDuration
    })}`);
    
    // Ensure the progress doesn't go below 0 or above 100
    return Math.max(0, Math.min(100, progressPercentage));
  }, [timeRemaining, totalTime, timerMode, settings]);

  // Return total time calculation function for other hooks to use
  const getTotalTimeForMode = () => {
    console.log(`Getting total time for mode: ${timerMode}, result: ${totalTime}`);
    return totalTime;
  };

  return {
    progress,
    totalTime,
    getTotalTimeForMode
  };
}
