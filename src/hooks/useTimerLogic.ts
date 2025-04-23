
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

  // CRITICAL CHANGE: Only update timeRemaining when mode or settings change AND not running AND not just paused
  useEffect(() => {
    // Don't reset time if we're running or if we just paused
    if (!isRunning && !skipTimerResetRef.current) {
      console.log("Setting time based on mode/settings change:", getTotalTime(timerMode, settings));
      setTimeRemaining(getTotalTime(timerMode, settings));
      
      // Reset session start time when mode changes
      sessionStartTimeRef.current = null;
    } else if (skipTimerResetRef.current) {
      // Reset the flag after we've skipped one update
      console.log("Skipping timer reset after pause");
      skipTimerResetRef.current = false;
    }
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
