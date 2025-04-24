
import { useState, useEffect, useRef } from 'react';
import { getTotalTime, TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from '@/hooks/useTimerSettings';
import { useRestoreTimerState } from './useRestoreTimerState';
import { useTimerVisibilitySync } from './useTimerVisibilitySync';
import { useTimerTickLogic } from './useTimerTickLogic';
import { useTimerControlsLogic } from './useTimerControlsLogic';
import { useTimerCompletion } from './useTimerCompletion';
import { useTimerStatsLogic } from './useTimerStatsLogic';
import { useTimerAudio } from './useTimerAudio';

export function useTimerLogic(settings: TimerSettings) {
  const [timerMode, setTimerMode] = useState<TimerMode>('work');
  const [autoStart, setAutoStart] = useState<boolean>(false);
  const sessionStartTimeRef = useRef<string | null>(null);
  const skipTimerResetRef = useRef<boolean>(false); // Track when we should skip resetting timer
  const previousSettingsRef = useRef(settings); // Store previous settings to detect changes

  // Use the smaller hooks
  const {
    completedSessions,
    setCompletedSessions,
    totalTimeToday,
    setTotalTimeToday,
    currentSessionIndex,
    setCurrentSessionIndex
  } = useTimerStatsLogic();

  const {
    isRunning,
    setIsRunning,
    timeRemaining,
    setTimeRemaining,
    lastRecordedFullMinutesRef,
    handleStart: baseHandleStart,
    handlePause: baseHandlePause,
    handleReset: baseHandleReset,
    handleModeChange: baseHandleModeChange,
    resetTimerState
  } = useTimerControlsLogic(settings);

  const { handleTimerComplete } = useTimerCompletion({
    timerMode,
    settings,
    completedSessions,
    currentSessionIndex,
    setCompletedSessions,
    setTimerMode,
    setIsRunning,
    setTotalTimeToday,
    setCurrentSessionIndex,
    resetTimerState
  });

  // Initialize audio
  useTimerAudio();

  // Store session start time when a session begins
  useEffect(() => {
    if (isRunning && !sessionStartTimeRef.current) {
      sessionStartTimeRef.current = new Date().toISOString();
      console.log(`Session started at: ${sessionStartTimeRef.current}`);
    }
  }, [isRunning]);

  // Detect settings changes and reset timer when needed
  useEffect(() => {
    const hasSettingsChanged = 
      previousSettingsRef.current.workDuration !== settings.workDuration ||
      previousSettingsRef.current.breakDuration !== settings.breakDuration ||
      previousSettingsRef.current.longBreakDuration !== settings.longBreakDuration ||
      previousSettingsRef.current.sessionsUntilLongBreak !== settings.sessionsUntilLongBreak;
    
    // If settings have changed and we're not running, reset the timer
    if (hasSettingsChanged && !isRunning) {
      console.log("Settings changed - resetting timer:", {
        oldSettings: previousSettingsRef.current,
        newSettings: settings
      });
      
      // Force reset the timer for the current mode with new settings
      skipTimerResetRef.current = false;
      const newTime = getTotalTime(timerMode, settings);
      console.log(`Resetting time to ${newTime} seconds due to settings change`);
      setTimeRemaining(newTime);
      
      // Reset session start time when settings change
      sessionStartTimeRef.current = null;

      // Save current settings for future comparisons
      previousSettingsRef.current = { ...settings };
    } else if (!isRunning && !skipTimerResetRef.current) {
      // Normal mode change or initial setup - set time based on current mode and settings
      console.log("Setting time based on mode/settings change:", getTotalTime(timerMode, settings));
      setTimeRemaining(getTotalTime(timerMode, settings));
      
      // Reset session start time
      sessionStartTimeRef.current = null;
    } else if (skipTimerResetRef.current) {
      // Reset the flag after we've skipped one update
      console.log("Skipping timer reset after pause");
      skipTimerResetRef.current = false;
    }
    
    // Always update the settings reference
    previousSettingsRef.current = { ...settings };
  }, [timerMode, settings, setTimeRemaining, isRunning]);
  
  // Auto-start feature - only used when completing a timer and auto-transitioning
  useEffect(() => {
    if (autoStart && !isRunning) {
      baseHandleStart(timerMode);
      setAutoStart(false);
    }
  }, [autoStart, isRunning, baseHandleStart, timerMode]);

  // Create wrappers for the control handlers
  const handleStart = () => {
    // Record the session start time
    sessionStartTimeRef.current = new Date().toISOString();
    baseHandleStart(timerMode);
  };
  
  const handlePause = () => {
    console.log("Setting skip flag before pause");
    skipTimerResetRef.current = true; // Set flag to skip the next timer reset
    baseHandlePause(timerMode);
  };
  
  const handleReset = () => {
    // Clear the session start time on reset
    sessionStartTimeRef.current = null;
    skipTimerResetRef.current = false; // Allow reset to happen
    baseHandleReset(timerMode, setCurrentSessionIndex);
  };

  const handleModeChange = (mode: TimerMode) => {
    // Clear the session start time on mode change
    sessionStartTimeRef.current = null;
    skipTimerResetRef.current = false; // Allow reset on mode change
    baseHandleModeChange(timerMode, mode, setCurrentSessionIndex);
    setTimerMode(mode);
  };

  // Get the current total time based on timer mode
  const getCurrentTotalTime = () => getTotalTime(timerMode, settings);

  // Create a reference to hold the timer state
  const timerStateRef = useRef({
    isRunning,
    timerMode,
    timeRemaining
  });

  // Keep the ref updated with current state
  useEffect(() => {
    timerStateRef.current = {
      isRunning,
      timerMode,
      timeRemaining
    };
  }, [isRunning, timerMode, timeRemaining]);

  // Reference for tracking the last tick time
  const lastTickTimeRef = useRef<number>(Date.now());

  // Use the restored timer state hook
  useRestoreTimerState({
    isRunning,
    setIsRunning,
    setTimeRemaining,
    onTimerComplete: handleTimerComplete,
    sessionStartTimeRef,
    setTimerMode
  });

  // Use the timer visibility sync hook
  useTimerVisibilitySync({
    isRunning,
    timerMode,
    timerStateRef,
    setTimeRemaining,
    onTimerComplete: handleTimerComplete,
    lastTickTimeRef,
    sessionStartTimeRef
  });

  // Use the timer tick logic hook
  useTimerTickLogic({
    isRunning,
    timerMode,
    getTotalTime: getCurrentTotalTime,
    onTimerComplete: handleTimerComplete,
    setTimeRemaining,
    timeRemaining,
    lastRecordedFullMinutesRef,
    lastTickTimeRef,
    sessionStartTimeRef
  });

  return {
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions,
    totalTimeToday,
    currentSessionIndex,
    setCompletedSessions,
    setTotalTimeToday,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    setAutoStart,
    sessionStartTimeRef
  };
}
