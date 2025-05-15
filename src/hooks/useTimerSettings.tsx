
import { useEffect, useState } from "react";

export interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  showNotifications: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  soundId: string;
}

const DEFAULT_SETTINGS: TimerSettings = {
  workDuration: 25, // 25 minutes
  breakDuration: 5, // 5 minutes
  longBreakDuration: 15, // 15 minutes
  sessionsUntilLongBreak: 4,
  autoStartBreaks: true,
  autoStartFocus: false,
  showNotifications: true,
  soundEnabled: true,
  soundVolume: 0.75,
  soundId: 'zen-bell'
};

export function useTimerSettings() {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on component mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem("timerSettings");
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        // Validate that we have all the required fields with proper types
        if (typeof parsed === 'object' && 
            typeof parsed.workDuration === 'number' &&
            typeof parsed.breakDuration === 'number' &&
            typeof parsed.longBreakDuration === 'number' &&
            typeof parsed.sessionsUntilLongBreak === 'number') {
          console.log("Loaded timer settings from localStorage:", parsed);
          setSettings(parsed);
        } else {
          console.warn("Invalid timer settings format in localStorage, using defaults");
          localStorage.setItem("timerSettings", JSON.stringify(DEFAULT_SETTINGS));
        }
      } else {
        // Initialize with default settings
        localStorage.setItem("timerSettings", JSON.stringify(DEFAULT_SETTINGS));
      }
    } catch (error) {
      console.error("Error loading timer settings:", error);
      // Reset to defaults on error
      localStorage.setItem("timerSettings", JSON.stringify(DEFAULT_SETTINGS));
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      console.log("Saved updated timer settings to localStorage:", settings);
      localStorage.setItem("timerSettings", JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving timer settings:", error);
    }
  }, [settings]);

  const updateSetting = (key: keyof TimerSettings, value: number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateSettings = (newSettings: Partial<TimerSettings>) => {
    console.log("Updating settings with:", newSettings);
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  return {
    settings,
    updateSetting,
    updateSettings
  };
}
