
// This file re-exports the useTimer hook from TimerContext
// and adds additional specialized hooks

import { useTimerContext } from '@/contexts/TimerContext';
import { useTimerControls } from './useTimerControls';
import { useTimerStats } from './useTimerStats';
import { useTimerSettings } from './useTimerSettings';

// Re-export the main hook with console logging for debugging
export const useTimer = () => {
  const timerContext = useTimerContext();
  
  // Enhanced logging for better debugging of timer functionality
  console.log("useTimer hook called with timerContext:", {
    mode: timerContext.timerMode,
    isRunning: timerContext.isRunning,
    timeRemaining: timerContext.timeRemaining,
    // Add timeFormatted to help with debugging
    timeFormatted: timerContext.formatTime(timerContext.timeRemaining),
    progress: timerContext.progress
  });
  
  return timerContext;
};

// Export specialized hooks
export { useTimerControls, useTimerStats, useTimerSettings };
