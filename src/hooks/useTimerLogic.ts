
import { useState, useEffect, useRef } from 'react';
import { getTotalTime, TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from '@/hooks/useTimerSettings';
import { useTimerInterval } from './useTimerInterval';
import { useTimerControlsLogic } from './useTimerControlsLogic';
import { useTimerCompletion } from './useTimerCompletion';
import { useTimerStatsLogic } from './useTimerStatsLogic';
import { useTimerAudio } from './useTimerAudio';

export function useTimerLogic(settings: TimerSettings) {
  const [timerMode, setTimerMode] = useState<TimerMode>('work');
  const [autoStart, setAutoStart] = useState<boolean>(false);
  const sessionStartTimeRef = useRef<string | null>(null);

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

  // Reset timer when mode or settings change
  useEffect(() => {
    setTimeRemaining(getTotalTime(timerMode, settings));
    
    // Reset session start time when mode changes
    if (!isRunning) {
      sessionStartTimeRef.current = null;
    }
  }, [timerMode, settings, setTimeRemaining, isRunning]);
  
  // Auto-start feature
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
    baseHandlePause(timerMode);
  };
  
  const handleReset = () => {
    // Clear the session start time on reset
    sessionStartTimeRef.current = null;
    baseHandleReset(timerMode, setCurrentSessionIndex);
  };

  const handleModeChange = (mode: TimerMode) => {
    // Clear the session start time on mode change
    sessionStartTimeRef.current = null;
    baseHandleModeChange(timerMode, mode, setCurrentSessionIndex);
    setTimerMode(mode);
  };

  // Get the current total time based on timer mode
  const getCurrentTotalTime = () => getTotalTime(timerMode, settings);

  // Use the timer interval hook
  useTimerInterval({
    isRunning,
    timerMode,
    timeRemaining,
    setTimeRemaining,
    getTotalTime: getCurrentTotalTime,
    onTimerComplete: handleTimerComplete,
    lastRecordedFullMinutesRef,
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
