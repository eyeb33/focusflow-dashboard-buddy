
import { useState, useEffect } from 'react';

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
    const savedSettings = localStorage.getItem('timerSettings');
    
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        return {...DEFAULT_TIMER_SETTINGS, ...parsed};
      } catch (e) {
        console.error('Error parsing timer settings', e);
        return DEFAULT_TIMER_SETTINGS;
      }
    }
    
    return DEFAULT_TIMER_SETTINGS;
  });
  
  // Update localStorage when settings change
  useEffect(() => {
    localStorage.setItem('timerSettings', JSON.stringify(settings));
    console.log('Saved updated timer settings:', settings);
  }, [settings]);
  
  // Function to update settings
  const updateSettings = (newSettings: Partial<TimerSettings>) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings
    }));
  };
  
  // Reset to defaults
  const resetSettings = () => {
    setSettings(DEFAULT_TIMER_SETTINGS);
  };
  
  return {
    settings,
    updateSettings,
    resetSettings
  };
}
