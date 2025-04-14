
import { useState } from 'react';

export interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

const defaultSettings: TimerSettings = {
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4
};

export const useTimerSettings = () => {
  const [settings, setSettings] = useState<TimerSettings>(defaultSettings);
  
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
  
  // Settings update function
  const updateSettings = (newSettings: Partial<TimerSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
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
