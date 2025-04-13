
import { useTimer } from '@/contexts/TimerContext';

export interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

export const useTimerSettings = () => {
  const timer = useTimer();
  
  // Extract only the settings
  const {
    settings,
    updateSettings
  } = timer;
  
  // Add helper functions for specific setting updates
  const updateWorkDuration = (minutes: number) => {
    updateSettings({ workDuration: minutes });
  };
  
  const updateBreakDuration = (minutes: number) => {
    updateSettings({ breakDuration: minutes });
  };
  
  const updateLongBreakDuration = (minutes: number) => {
    updateSettings({ longBreakDuration: minutes });
  };
  
  const updateSessionsUntilLongBreak = (count: number) => {
    updateSettings({ sessionsUntilLongBreak: count });
  };
  
  return {
    settings,
    updateSettings,
    updateWorkDuration,
    updateBreakDuration,
    updateLongBreakDuration,
    updateSessionsUntilLongBreak
  };
};
