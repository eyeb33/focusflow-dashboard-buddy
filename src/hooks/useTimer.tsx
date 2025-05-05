
import { useTimerContext } from '@/contexts/TimerContext';

// Re-export the main hook for component use
export const useTimer = useTimerContext;

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
  
  // Create wrappers with enhanced logging to maintain compatibility
  const start = () => {
    console.log("START called from useTimerControls - Current time:", timeRemaining);
    handleStart();
  };
  
  const pause = () => {
    console.log("PAUSE called from useTimerControls - Current time:", timeRemaining);
    handlePause();
  };
  
  const reset = () => {
    console.log("RESET called from useTimerControls - Current time:", timeRemaining);
    handleReset();
  };
  
  const changeMode = (mode: any) => {
    console.log("CHANGE MODE called from useTimerControls - New mode:", mode);
    handleModeChange(mode);
  };
  
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
