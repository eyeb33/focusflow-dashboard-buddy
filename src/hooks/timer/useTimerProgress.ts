
import { useEffect } from 'react';
import { TimerSettings } from '../useTimerSettings';
import { TimerMode } from '@/utils/timerContextUtils';

export function useTimerProgress(
  timerMode: TimerMode,
  timeRemaining: number,
  settings: TimerSettings
) {
  // Calculate total time for current timer mode
  const getTotalTime = (): number => {
    switch (timerMode) {
      case 'break':
        return settings.breakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
      case 'work':
      default:
        return settings.workDuration * 60;
    }
  };
  
  // Calculate progress
  const totalTime = getTotalTime();
  const elapsedTime = totalTime - timeRemaining;
  const progress = totalTime > 0 ? Math.max(0, Math.min(1, elapsedTime / totalTime)) : 0;

  // Debug progress calculation
  useEffect(() => {
    console.log(`Progress calculation: ${timerMode} mode - total=${totalTime}, remaining=${timeRemaining}, elapsed=${elapsedTime}, progress=${progress.toFixed(4)}`);
  }, [timeRemaining, totalTime, progress, timerMode]);

  return {
    progress,
    getTotalTime
  };
}
