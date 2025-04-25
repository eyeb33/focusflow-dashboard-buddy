
import { useEffect } from 'react';
import { getTotalTime, TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from './useTimerSettings';

interface UseTimerSettingsSyncProps {
  timerMode: TimerMode;
  settings: TimerSettings;
  isRunning: boolean;
  setTimeRemaining: (time: number) => void;
  skipTimerResetRef: React.MutableRefObject<boolean>;
  modeChangeInProgressRef: React.MutableRefObject<boolean>;
  previousSettingsRef: React.MutableRefObject<any>;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
}

export function useTimerSettingsSync({
  timerMode,
  settings,
  isRunning,
  setTimeRemaining,
  skipTimerResetRef,
  modeChangeInProgressRef,
  previousSettingsRef,
  sessionStartTimeRef
}: UseTimerSettingsSyncProps) {
  useEffect(() => {
    if (modeChangeInProgressRef.current) {
      modeChangeInProgressRef.current = false;
      return;
    }
    
    const hasSettingsChanged = 
      previousSettingsRef.current?.workDuration !== settings.workDuration ||
      previousSettingsRef.current?.breakDuration !== settings.breakDuration ||
      previousSettingsRef.current?.longBreakDuration !== settings.longBreakDuration ||
      previousSettingsRef.current?.sessionsUntilLongBreak !== settings.sessionsUntilLongBreak;
    
    if (hasSettingsChanged && !isRunning) {
      console.log("Settings changed - resetting timer:", {
        oldSettings: previousSettingsRef.current,
        newSettings: settings
      });
      
      skipTimerResetRef.current = false;
      const newTime = getTotalTime(timerMode, settings);
      console.log(`Resetting time to ${newTime} seconds due to settings change`);
      setTimeRemaining(newTime);
      
      sessionStartTimeRef.current = null;
      
      previousSettingsRef.current = { ...settings };
    } else if (!isRunning && !skipTimerResetRef.current) {
      console.log("Setting time based on mode/settings change:", getTotalTime(timerMode, settings));
      setTimeRemaining(getTotalTime(timerMode, settings));
      
      sessionStartTimeRef.current = null;
    } else if (skipTimerResetRef.current) {
      console.log("Skipping timer reset after pause");
      skipTimerResetRef.current = false;
    }
    
    previousSettingsRef.current = { ...settings };
  }, [timerMode, settings, isRunning]);
}
