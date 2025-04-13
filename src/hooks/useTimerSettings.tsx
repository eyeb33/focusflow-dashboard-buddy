
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
    console.log('Updating work duration to:', minutes);
    updateSettings({ workDuration: minutes });
  };
  
  const updateBreakDuration = (minutes: number) => {
    console.log('Updating break duration to:', minutes);
    updateSettings({ breakDuration: minutes });
  };
  
  const updateLongBreakDuration = (minutes: number) => {
    console.log('Updating long break duration to:', minutes);
    updateSettings({ longBreakDuration: minutes });
  };
  
  const updateSessionsUntilLongBreak = (count: number) => {
    console.log('Updating sessions until long break to:', count);
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
