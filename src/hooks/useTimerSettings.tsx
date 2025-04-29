import { useEffect, useState } from "react";

export function useTimerSettings() {
  const [settings, setSettings] = useState({
    workDuration: 25 * 60, // 25 minutes
    breakDuration: 5 * 60, // 5 minutes
    longBreakDuration: 15 * 60, // 15 minutes
    sessionsBeforeLongBreak: 4,
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

  const updateSetting = (key: keyof typeof settings, value: number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return {
    settings,
    updateSetting,
  };
}
