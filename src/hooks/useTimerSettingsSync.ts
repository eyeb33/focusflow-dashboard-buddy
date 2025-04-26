
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
    
    // Only update timer if settings changed AND the timer is not running AND we're not skipping reset
    if (hasSettingsChanged && !isRunning && !skipTimerResetRef.current) {
      console.log("Settings changed - resetting timer:", {
        oldSettings: previousSettingsRef.current,
        newSettings: settings
      });
      
      const newTime = getTotalTime(timerMode, settings);
      console.log(`Resetting time to ${newTime} seconds due to settings change`);
      setTimeRemaining(newTime);
      
      sessionStartTimeRef.current = null;
    } else if (!isRunning && !skipTimerResetRef.current) {
      // If timer isn't running and we're not skipping reset, set time based on mode/settings
      console.log("Setting time based on mode/settings change:", getTotalTime(timerMode, settings));
      setTimeRemaining(getTotalTime(timerMode, settings));
      
      sessionStartTimeRef.current = null;
    } else if (skipTimerResetRef.current) {
      console.log("Skipping timer reset after pause/resume");
      // Once we've acknowledged the skip, reset the flag so future settings changes can take effect
      skipTimerResetRef.current = false;
    }
    
    previousSettingsRef.current = { ...settings };
  }, [timerMode, settings, isRunning, setTimeRemaining, skipTimerResetRef, modeChangeInProgressRef, previousSettingsRef, sessionStartTimeRef]);
}
