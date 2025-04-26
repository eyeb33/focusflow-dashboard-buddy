
import { useState, useEffect } from 'react';

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
  
  // Load settings from localStorage on component mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('timerSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        
        // Validate loaded settings to ensure they're within allowed ranges
        const validatedSettings = {
          workDuration: validateSetting(parsedSettings.workDuration, 5, 60, defaultSettings.workDuration),
          breakDuration: validateSetting(parsedSettings.breakDuration, 1, 15, defaultSettings.breakDuration),
          longBreakDuration: validateSetting(parsedSettings.longBreakDuration, 10, 30, defaultSettings.longBreakDuration),
          sessionsUntilLongBreak: validateSetting(parsedSettings.sessionsUntilLongBreak, 1, 8, defaultSettings.sessionsUntilLongBreak),
        };
        
        setSettings(validatedSettings);
        console.log("Loaded timer settings from localStorage:", validatedSettings);
      } else {
        // Make sure the storage is initialized with default values
        localStorage.setItem('timerSettings', JSON.stringify(defaultSettings));
      }
    } catch (error) {
      console.error("Error loading timer settings:", error);
      // Fallback to default settings
      setSettings(defaultSettings);
    }
  }, []);
  
  // Helper function to validate settings are within allowed ranges
  const validateSetting = (value: any, min: number, max: number, defaultValue: number): number => {
    if (typeof value !== 'number' || isNaN(value) || value < min || value > max) {
      return defaultValue;
    }
    return value;
  };
  
  // Settings update function with validation
  const updateSettings = (newSettings: Partial<TimerSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      // Save to localStorage
      localStorage.setItem('timerSettings', JSON.stringify(updated));
      console.log("Saved updated timer settings:", updated);
      
      return updated;
    });
  };
  
  // Helper functions for specific setting updates
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
