
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
    
    console.log("Settings sync check:", { 
      hasSettingsChanged, 
      isRunning, 
      skipTimerReset: skipTimerResetRef.current,
      prev: previousSettingsRef.current,
      current: settings
    });
    
    // Check if we need to skip the timer reset (e.g., after a pause)
    if (skipTimerResetRef.current) {
      console.log("Skipping timer reset due to skipTimerResetRef flag");
      
      // We've acknowledged the skip flag, but keep it for 100ms to ensure all effects have time to run
      setTimeout(() => {
        skipTimerResetRef.current = false;
        console.log("Reset skipTimerResetRef after delay");
      }, 100);
      
      // Always update the settings ref
      previousSettingsRef.current = { ...settings };
      return;
    }
    
    // Only update timer if settings changed AND the timer is not running
    if (hasSettingsChanged && !isRunning) {
      console.log("Settings changed - resetting timer:", {
        oldSettings: previousSettingsRef.current,
        newSettings: settings
      });
      
      const newTime = getTotalTime(timerMode, settings);
      console.log(`Resetting time to ${newTime} seconds due to settings change`);
      setTimeRemaining(newTime);
      
      sessionStartTimeRef.current = null;
    } else if (!isRunning && previousSettingsRef.current === null) {
      // If timer isn't running and this is initial settings load, set time based on mode/settings
      console.log("Initial settings load - setting time based on mode:", getTotalTime(timerMode, settings));
      setTimeRemaining(getTotalTime(timerMode, settings));
      
      sessionStartTimeRef.current = null;
    }
    
    // Always update the settings ref
    previousSettingsRef.current = { ...settings };
  }, [
    timerMode,
    settings,
    isRunning,
    setTimeRemaining,
    skipTimerResetRef,
    modeChangeInProgressRef,
    previousSettingsRef,
    sessionStartTimeRef
  ]);
}
