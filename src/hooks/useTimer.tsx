
// This file re-exports the useTimer hook from TimerContext
// and adds additional specialized hooks

import { useTimer as useTimerContext } from '@/contexts/TimerContext';
import { useTimerControls } from './useTimerControls';
import { useTimerStats } from './useTimerStats';
import { useTimerSettings } from './useTimerSettings';

// Re-export the main hook with console logging for debugging
export const useTimer = () => {
  const timerContext = useTimerContext();
  
  // Log timer context for debugging
  console.log("Timer context:", {
    mode: timerContext.timerMode,
    isRunning: timerContext.isRunning,
    timeRemaining: timerContext.timeRemaining
  });
  
  return timerContext;
};

// Export specialized hooks
export { useTimerControls, useTimerStats, useTimerSettings };
