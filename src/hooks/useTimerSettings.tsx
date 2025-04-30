
import { useEffect, useState } from "react";

export interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

export function useTimerSettings() {
  const [settings, setSettings] = useState<TimerSettings>({
    workDuration: 25, // 25 minutes
    breakDuration: 5, // 5 minutes
    longBreakDuration: 15, // 15 minutes
    sessionsUntilLongBreak: 4,
  });

  useEffect(() => {
    const storedSettings = localStorage.getItem("timerSettings");
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("timerSettings", JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key: keyof TimerSettings, value: number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateSettings = (newSettings: Partial<TimerSettings>) => {
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
