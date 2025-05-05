
// This file re-exports the useTimer hook from TimerContext
// and adds additional specialized hooks for backward compatibility

import { useTimerContext } from '@/contexts/TimerContext';
import { TimerMode } from '@/utils/timerContextUtils';
import { useCallback } from 'react';

// Re-export the main hook
export const useTimer = () => {
  const timerContext = useTimerContext();
  return timerContext;
};

// Export specialized hooks for backward compatibility
export const useTimerControls = () => {
  const timer = useTimerContext();
  
  const {
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    isRunning,
    timerMode,
    getModeLabel,
    formatTime,
    timeRemaining,
    progress,
    currentSessionIndex
  } = timer;
  
  // Log the timer state to help with debugging
  console.log("useTimerControls state:", {
    isRunning,
    timerMode,
    timeRemaining,
    progress,
    currentSessionIndex
  });
  
  // Create wrappers with enhanced logging to maintain compatibility
  const start = useCallback(() => {
    console.log("START called from useTimerControls - Current time:", timeRemaining);
    handleStart();
  }, [handleStart, timeRemaining]);
  
  const pause = useCallback(() => {
    console.log("PAUSE called from useTimerControls - Current time:", timeRemaining);
    handlePause();
  }, [handlePause, timeRemaining]);
  
  const reset = useCallback(() => {
    console.log("RESET called from useTimerControls - Current time:", timeRemaining);
    handleReset();
  }, [handleReset, timeRemaining]);
  
  const changeMode = useCallback((mode: TimerMode) => {
    console.log("CHANGE MODE called from useTimerControls - New mode:", mode);
    handleModeChange(mode);
  }, [handleModeChange]);
  
  return {
    isRunning,
    timerMode,
    timeRemaining,
    progress,
    currentSessionIndex,
    formatTime,
    start,
    pause,
    reset,
    changeMode,
    getModeLabel
  };
};

// Re-export these for compatibility
export { useTimerStats } from '@/hooks/useTimerStats';
export { useTimerSettings } from '@/hooks/useTimerSettings';
