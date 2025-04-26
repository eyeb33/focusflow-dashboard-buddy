
import { useState, useEffect, useCallback } from 'react';

export interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  workDuration: 25,     // 25 minutes for work/focus
  breakDuration: 5,     // 5 minutes for short break
  longBreakDuration: 15, // 15 minutes for long break
  sessionsUntilLongBreak: 4 // 4 sessions until long break
};

export function useTimerSettings() {
  const [settings, setSettings] = useState<TimerSettings>(() => {
    // Try to get settings from localStorage
    try {
      const savedSettings = localStorage.getItem('timerSettings');
      
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return {...DEFAULT_TIMER_SETTINGS, ...parsed};
      }
    } catch (e) {
      console.error('Error parsing timer settings', e);
    }
    
    return DEFAULT_TIMER_SETTINGS;
  });
  
  // Update localStorage when settings change
  useEffect(() => {
    try {
      localStorage.setItem('timerSettings', JSON.stringify(settings));
      console.log('Saved updated timer settings to localStorage:', settings);
    } catch (e) {
      console.error('Error saving timer settings', e);
    }
  }, [settings]);
  
  // Function to update settings
  const updateSettings = useCallback((newSettings: Partial<TimerSettings>) => {
    console.log('Updating settings with:', newSettings);
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings
    }));
  }, []);
  
  // Reset to defaults
  const resetSettings = useCallback(() => {
    console.log('Resetting timer settings to defaults');
    setSettings(DEFAULT_TIMER_SETTINGS);
  }, []);
  
  return {
    settings,
    updateSettings,
    resetSettings
  };
}
