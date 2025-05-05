
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

export function useTimerProgress(
  timerMode: TimerMode, 
  timeRemaining: number, 
  settings: TimerSettings
) {
  const getTotalTimeForMode = useCallback(() => {
    console.log('Getting total time for mode:', timerMode);
    switch (timerMode) {
      case 'work': return settings.workDuration * 60;
      case 'break': return settings.breakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
      default: return settings.workDuration * 60;
    }
  }, [timerMode, settings]);
  
  const totalSeconds = getTotalTimeForMode();
  const progress = Math.max(0, Math.min(100, 
    ((totalSeconds - timeRemaining) / totalSeconds) * 100
  ));
  
  return {
    progress,
    getTotalTimeForMode,
    totalSeconds
  };
}
