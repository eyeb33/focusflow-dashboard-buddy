
import { useState, useEffect } from 'react';
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

  // Reset timer when mode or settings change
  useEffect(() => {
    setTimeRemaining(getTotalTime(timerMode, settings));
  }, [timerMode, settings, setTimeRemaining]);
  
  // Auto-start feature
  useEffect(() => {
    if (autoStart && !isRunning) {
      baseHandleStart(timerMode);
      setAutoStart(false);
    }
  }, [autoStart, isRunning, baseHandleStart, timerMode]);

  // Create wrappers for the control handlers
  const handleStart = () => baseHandleStart(timerMode);
  
  const handlePause = () => baseHandlePause(timerMode);
  
  const handleReset = () => baseHandleReset(timerMode, setCurrentSessionIndex);

  const handleModeChange = (mode: TimerMode) => {
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
    lastRecordedFullMinutesRef
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
    setAutoStart
  };
}
