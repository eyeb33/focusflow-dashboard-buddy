
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from '@/hooks/useTimerSettings';

interface NextTimerParams {
  timerMode: TimerMode;
  completedSessions: number;
  settings: TimerSettings;
}

export function useNextTimerMode() {
  const determineNextMode = ({ timerMode, completedSessions, settings }: NextTimerParams): {
    nextMode: TimerMode;
    nextDuration: number;
  } => {
    if (timerMode === 'work') {
      // After work comes a break
      if (completedSessions % settings.sessionsUntilLongBreak === 0) {
        return {
          nextMode: 'longBreak',
          nextDuration: settings.longBreakDuration * 60
        };
      } else {
        return {
          nextMode: 'break',
          nextDuration: settings.breakDuration * 60
        };
      }
    } else {
      // After any break comes work
      return {
        nextMode: 'work',
        nextDuration: settings.workDuration * 60
      };
    }
  };
  
  return { determineNextMode };
}
